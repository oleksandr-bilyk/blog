#!/usr/bin/env python3
"""Generate deterministic publication-safe F# dependency graph artifacts."""

from __future__ import annotations

import argparse
import hashlib
import json
from itertools import product
from pathlib import Path, PurePosixPath
import re
import runpy
import tomllib
from typing import Iterable, Mapping


LAYERS = ("Model", "Services", "Infrastructure", "WebApi")
PUBLIC_SCOPE = "Subservice.fsproj F# Compile items"
PUBLIC_DESCRIPTION = (
    "Original Subservice layout with extraction changes overlaid. "
    "Node positions and dependency routes remain fixed."
)
PUBLIC_METADATA = {
    "baseline_revision": "publication-snapshot",
    "destination_snapshot": "extracted-subservice-snapshot",
    "file_scope": PUBLIC_SCOPE,
}
WORD_LEFT = (
    "Amber",
    "Aster",
    "Bright",
    "Cedar",
    "Coral",
    "Crisp",
    "Dawn",
    "Elm",
    "Ember",
    "Frost",
    "Golden",
    "Harbor",
    "Indigo",
    "Ivory",
    "Juniper",
    "Lunar",
    "Maple",
    "Meadow",
    "Nimbus",
    "Olive",
    "Opal",
    "Quartz",
    "River",
    "Sage",
    "Silver",
    "Solar",
    "Spruce",
    "Stone",
    "Willow",
)
WORD_RIGHT = (
    "Anchor",
    "Beacon",
    "Bridge",
    "Brook",
    "Canyon",
    "Cloud",
    "Comet",
    "Cove",
    "Falcon",
    "Field",
    "Forest",
    "Garden",
    "Grove",
    "Harbor",
    "Hill",
    "Island",
    "Lake",
    "Orchid",
    "Peak",
    "Pine",
    "Reef",
    "Ridge",
    "Sky",
    "Spring",
    "Star",
    "Summit",
    "Trail",
    "Valley",
    "Wave",
    "Wood",
)


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--monolith", type=Path, required=True)
    parser.add_argument("--subservice-original", type=Path, required=True)
    parser.add_argument("--subservice-destination", type=Path, required=True)
    parser.add_argument("--comparison", type=Path, required=True)
    parser.add_argument("--monolith-root", required=True)
    parser.add_argument("--subservice-root", required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--private-manifest", type=Path, required=True)
    parser.add_argument("--standalone-renderer", type=Path, required=True)
    parser.add_argument("--comparison-renderer", type=Path, required=True)
    parser.add_argument("--scan-file", action="append", type=Path, default=[])
    return parser.parse_args()


def normalize_path(value: str | Path) -> str:
    return str(value).replace("\\", "/").strip("/")


def read_toml(path: Path) -> dict[str, object]:
    return tomllib.loads(path.read_text(encoding="utf-8-sig"))


def graph_paths(document: Mapping[str, object]) -> list[str]:
    files = document.get("files")
    if not isinstance(files, dict):
        raise ValueError("Graph document must contain a [files] table.")
    return [normalize_path(str(value)) for value in files.values()]


def graph_signature(document: Mapping[str, object]) -> tuple[object, object]:
    files = document.get("files")
    dependencies = document.get("dependencies")
    if not isinstance(files, dict) or not isinstance(dependencies, dict):
        raise ValueError("Graph must contain files and dependencies tables.")
    return tuple(files.keys()), dependencies


def strip_root(path: str, root: str) -> PurePosixPath:
    normalized_path = normalize_path(path)
    normalized_root = normalize_path(root)
    prefix = normalized_root + "/"
    if not normalized_path.startswith(prefix):
        raise ValueError(
            f"Path {normalized_path!r} is outside configured root "
            f"{normalized_root!r}."
        )
    return PurePosixPath(normalized_path[len(prefix) :])


def all_source_paths(
    monolith: Mapping[str, object],
    original: Mapping[str, object],
    destination: Mapping[str, object],
    comparison: Mapping[str, object],
) -> set[str]:
    paths = set(graph_paths(monolith))
    paths.update(graph_paths(original))
    paths.update(graph_paths(destination))
    paths.update(graph_paths(comparison))
    comparison_table = comparison.get("comparison")
    if not isinstance(comparison_table, dict):
        raise ValueError("Comparison document must contain [comparison].")

    for item in comparison_table.get("files", []):
        if not isinstance(item, dict):
            raise ValueError("Comparison file entry must be a table.")
        for key in ("path_before", "path_after"):
            value = item.get(key)
            if value is not None:
                paths.add(normalize_path(str(value)))

    for item in comparison_table.get("dependency_deltas", []):
        if not isinstance(item, dict):
            raise ValueError("Comparison dependency entry must be a table.")
        paths.add(normalize_path(str(item["source_path"])))
        paths.add(normalize_path(str(item["target_path"])))

    return paths


def source_tokens(paths: Iterable[str], roots: Iterable[str]) -> set[str]:
    tokens: set[str] = set()
    for root in roots:
        tokens.update(PurePosixPath(normalize_path(root)).parts)
    for path in paths:
        item = PurePosixPath(normalize_path(path))
        tokens.update(item.parts)
        tokens.add(item.stem)
    return {
        token
        for token in tokens
        if token not in {"src", *LAYERS}
        and token
        and token != "."
    }


def alias_forbidden_tokens(tokens: Iterable[str]) -> set[str]:
    result = set(tokens)
    for token in tokens:
        result.update(
            re.findall(
                r"[A-Z]+(?=[A-Z][a-z]|$)|[A-Z]?[a-z]+|[0-9]+",
                token,
            )
        )
    return result


def alias_candidates(prefix: str) -> Iterable[str]:
    for left, right in product(WORD_LEFT, WORD_RIGHT):
        yield f"{prefix}{left}{right}"


def assign_aliases(
    identities: Iterable[tuple[str, ...]],
    prefix: str,
    forbidden: set[str],
) -> dict[tuple[str, ...], str]:
    forbidden_casefold = {
        item.casefold() for item in forbidden if len(item) >= 4
    }
    candidates = (
        candidate
        for candidate in alias_candidates(prefix)
        if not any(
            token in candidate.casefold() for token in forbidden_casefold
        )
    )
    result: dict[tuple[str, ...], str] = {}
    for identity in sorted(set(identities)):
        try:
            result[identity] = next(candidates)
        except StopIteration as error:
            raise ValueError(f"Not enough {prefix} alias candidates.") from error
    return result


def canonical_relatives(
    paths: Iterable[str],
    monolith_root: str,
    subservice_root: str,
) -> dict[str, PurePosixPath]:
    result: dict[str, PurePosixPath] = {}
    for path in paths:
        normalized = normalize_path(path)
        if normalized.startswith(normalize_path(monolith_root) + "/"):
            relative = strip_root(normalized, monolith_root)
        elif normalized.startswith(normalize_path(subservice_root) + "/"):
            relative = strip_root(normalized, subservice_root)
        else:
            raise ValueError(f"Could not classify source path {normalized!r}.")
        result[normalized] = relative
    return result


def build_alias_model(
    relatives: Iterable[PurePosixPath],
    forbidden: set[str],
) -> tuple[dict[tuple[str, ...], str], dict[tuple[str, ...], str]]:
    folders: set[tuple[str, ...]] = set()
    files: set[tuple[str, ...]] = set()
    for relative in relatives:
        parts = relative.parts
        files.add(parts)
        first_folder = 1 if parts and parts[0] in LAYERS else 0
        for index in range(first_folder + 1, len(parts)):
            folders.add(parts[:index])

    return (
        assign_aliases(folders, "Area", forbidden),
        assign_aliases(files, "Module", forbidden),
    )


def public_relative_path(
    relative: PurePosixPath,
    folder_aliases: Mapping[tuple[str, ...], str],
    file_aliases: Mapping[tuple[str, ...], str],
) -> PurePosixPath:
    parts = relative.parts
    result: list[str] = []
    first_folder = 0
    if parts and parts[0] in LAYERS:
        result.append(parts[0])
        first_folder = 1

    for index in range(first_folder + 1, len(parts)):
        result.append(folder_aliases[parts[:index]])

    result.append(file_aliases[parts] + relative.suffix)
    return PurePosixPath(*result)


def path_maps(
    paths: Iterable[str],
    relatives: Mapping[str, PurePosixPath],
    monolith_root: str,
    subservice_root: str,
    folder_aliases: Mapping[tuple[str, ...], str],
    file_aliases: Mapping[tuple[str, ...], str],
) -> tuple[dict[str, str], dict[str, str]]:
    monolith: dict[str, str] = {}
    subservice: dict[str, str] = {}
    monolith_prefix = normalize_path(monolith_root) + "/"
    subservice_prefix = normalize_path(subservice_root) + "/"

    for source in sorted(paths):
        relative = public_relative_path(
            relatives[source],
            folder_aliases,
            file_aliases,
        )
        if source.startswith(monolith_prefix):
            monolith[source] = str(PurePosixPath("src", "Monolith", relative))
        elif source.startswith(subservice_prefix):
            subservice[source] = str(
                PurePosixPath("src", "Subservice", relative)
            )
        else:
            raise ValueError(f"Could not assign public root for {source!r}.")

    return monolith, subservice


def replace_quoted_paths(text: str, mapping: Mapping[str, str]) -> str:
    result = text
    for source, destination in sorted(
        mapping.items(),
        key=lambda item: len(item[0]),
        reverse=True,
    ):
        result = result.replace(f'"{source}"', f'"{destination}"')
        result = result.replace(
            f'"{source.replace("/", "\\\\")}"',
            f'"{destination}"',
        )
    return result


def replace_scalar(text: str, key: str, value: str) -> str:
    pattern = re.compile(rf"(?m)^{re.escape(key)}\s*=\s*\"[^\"]*\"$")
    updated, count = pattern.subn(f'{key} = "{value}"', text, count=1)
    if count != 1:
        raise ValueError(f"Expected exactly one {key} metadata field.")
    return updated


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8", newline="\n")


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def validate_graph_rewrite(
    source: Mapping[str, object],
    sanitized: Mapping[str, object],
    mapping: Mapping[str, str],
) -> None:
    source_files = source["files"]
    sanitized_files = sanitized["files"]
    if not isinstance(source_files, dict) or not isinstance(
        sanitized_files,
        dict,
    ):
        raise ValueError("Graph files must be tables.")
    if tuple(source_files.keys()) != tuple(sanitized_files.keys()):
        raise ValueError("Sanitized file IDs changed.")
    for file_id, source_path in source_files.items():
        expected = mapping[normalize_path(str(source_path))]
        if sanitized_files[file_id] != expected:
            raise ValueError(f"Sanitized path mismatch for file {file_id}.")
    if source["dependencies"] != sanitized["dependencies"]:
        raise ValueError("Sanitized dependency topology or counts changed.")


def validate_comparison_rewrite(
    source: Mapping[str, object],
    sanitized: Mapping[str, object],
    mapping: Mapping[str, str],
) -> None:
    validate_graph_rewrite(source, sanitized, mapping)
    source_table = source["comparison"]
    sanitized_table = sanitized["comparison"]
    if not isinstance(source_table, dict) or not isinstance(
        sanitized_table,
        dict,
    ):
        raise ValueError("Comparison tables are invalid.")

    neutralized = {
        "baseline_revision",
        "destination_snapshot",
        "file_scope",
        "original_graph_sha256",
        "destination_graph_sha256",
    }
    for key, value in source_table.items():
        if key in neutralized or key in {"files", "dependency_deltas"}:
            continue
        if sanitized_table.get(key) != value:
            raise ValueError(f"Comparison metadata {key!r} changed.")

    source_files = source_table["files"]
    sanitized_files = sanitized_table["files"]
    if len(source_files) != len(sanitized_files):
        raise ValueError("Comparison file inventory length changed.")
    for source_item, sanitized_item in zip(source_files, sanitized_files):
        for key, value in source_item.items():
            if key in {"path_before", "path_after"}:
                expected = (
                    mapping[normalize_path(str(value))]
                    if value is not None
                    else None
                )
                if sanitized_item.get(key) != expected:
                    raise ValueError(f"Comparison {key} rewrite mismatch.")
            elif sanitized_item.get(key) != value:
                raise ValueError(f"Comparison file field {key!r} changed.")

    source_deltas = source_table["dependency_deltas"]
    sanitized_deltas = sanitized_table["dependency_deltas"]
    if len(source_deltas) != len(sanitized_deltas):
        raise ValueError("Dependency delta length changed.")
    for source_item, sanitized_item in zip(source_deltas, sanitized_deltas):
        for key, value in source_item.items():
            if key in {"source_path", "target_path"}:
                expected = mapping[normalize_path(str(value))]
                if sanitized_item.get(key) != expected:
                    raise ValueError(f"Dependency delta {key} mismatch.")
            elif sanitized_item.get(key) != value:
                raise ValueError(f"Dependency delta field {key!r} changed.")


def private_identity_values(
    paths: Iterable[str],
    roots: Iterable[str],
    comparison: Mapping[str, object],
) -> set[str]:
    values = set(paths)
    values.update(normalize_path(root) for root in roots)
    table = comparison["comparison"]
    if not isinstance(table, dict):
        raise ValueError("Comparison table is invalid.")
    for key in (
        "baseline_revision",
        "destination_snapshot",
        "file_scope",
        "original_graph_sha256",
        "destination_graph_sha256",
    ):
        values.add(str(table[key]))
    return {value for value in values if value}


def validate_no_disclosure(
    files: Iterable[Path],
    forbidden_tokens: set[str],
    identity_values: set[str],
) -> None:
    allowed_tokens = {
        "Data",
        "Dependency",
        "File",
        "Files",
        "Graph",
        "Health",
        "Model",
        "Service",
        "Services",
        "Infrastructure",
        "WebApi",
    }
    checked_tokens = {
        token
        for token in forbidden_tokens
        if len(token) >= 5 and token not in allowed_tokens
    }
    for path in files:
        text = path.read_text(encoding="utf-8-sig")
        for value in identity_values:
            if value in text or value.replace("/", "\\") in text:
                raise ValueError(
                    f"Private identity value leaked into {path}: {value!r}"
                )
        if path.suffix.lower() == ".py":
            continue
        for token in checked_tokens:
            if token in text:
                raise ValueError(
                    f"Private source token leaked into {path}: {token!r}"
                )


def generate_standalone_html(
    renderer_path: Path,
    graph_path: Path,
    output_path: Path,
    title: str,
) -> None:
    namespace = runpy.run_path(str(renderer_path))
    load_graph = namespace.get("load_graph")
    render_html = namespace.get("render_html")
    if not callable(load_graph) or not callable(render_html):
        raise RuntimeError("Standalone renderer API is unavailable.")
    write_text(
        output_path,
        render_html(load_graph(graph_path), title, True),
    )


def generate_comparison_html(
    renderer_path: Path,
    comparison_path: Path,
    output_path: Path,
) -> None:
    namespace = runpy.run_path(str(renderer_path))
    generate_html = namespace.get("generate_html")
    if not callable(generate_html):
        raise RuntimeError("Comparison renderer API is unavailable.")
    generate_html(
        comparison_path,
        output_path,
        "Subservice Dependency Comparison",
        PUBLIC_SCOPE,
        PUBLIC_DESCRIPTION,
        True,
    )


def main() -> None:
    arguments = parse_arguments()
    source_documents = {
        "monolith": read_toml(arguments.monolith),
        "original": read_toml(arguments.subservice_original),
        "destination": read_toml(arguments.subservice_destination),
        "comparison": read_toml(arguments.comparison),
    }
    paths = all_source_paths(
        source_documents["monolith"],
        source_documents["original"],
        source_documents["destination"],
        source_documents["comparison"],
    )
    roots = (arguments.monolith_root, arguments.subservice_root)
    forbidden_tokens = source_tokens(paths, roots)
    relatives = canonical_relatives(paths, *roots)
    folder_aliases, file_aliases = build_alias_model(
        relatives.values(),
        alias_forbidden_tokens(forbidden_tokens),
    )
    monolith_map, subservice_map = path_maps(
        paths,
        relatives,
        *roots,
        folder_aliases,
        file_aliases,
    )
    if len(set(folder_aliases.values())) != len(folder_aliases):
        raise ValueError("Folder aliases are not one-to-one.")
    if len(set(file_aliases.values())) != len(file_aliases):
        raise ValueError("File aliases are not one-to-one.")

    monolith_by_relative = {
        relatives[source]: PurePosixPath(destination).parts[2:]
        for source, destination in monolith_map.items()
    }
    subservice_by_relative = {
        relatives[source]: PurePosixPath(destination).parts[2:]
        for source, destination in subservice_map.items()
    }
    for relative in monolith_by_relative.keys() & subservice_by_relative.keys():
        if monolith_by_relative[relative] != subservice_by_relative[relative]:
            raise ValueError(
                f"Corresponding path alias differs for {relative}."
            )

    output_dir = arguments.output_dir
    outputs = {
        "monolith": output_dir / "Monolith-file-dependencies.toml",
        "original": (
            output_dir / "Subservice-file-dependencies.original.toml"
        ),
        "destination": (
            output_dir / "Subservice-file-dependencies.destination.toml"
        ),
        "comparison": (
            output_dir / "Subservice-file-dependencies.comparison.toml"
        ),
    }

    write_text(
        outputs["monolith"],
        replace_quoted_paths(
            arguments.monolith.read_text(encoding="utf-8-sig"),
            monolith_map,
        ),
    )
    write_text(
        outputs["original"],
        replace_quoted_paths(
            arguments.subservice_original.read_text(encoding="utf-8-sig"),
            subservice_map,
        ),
    )
    write_text(
        outputs["destination"],
        replace_quoted_paths(
            arguments.subservice_destination.read_text(encoding="utf-8-sig"),
            subservice_map,
        ),
    )

    comparison_text = replace_quoted_paths(
        arguments.comparison.read_text(encoding="utf-8-sig"),
        subservice_map,
    )
    for key, value in PUBLIC_METADATA.items():
        comparison_text = replace_scalar(comparison_text, key, value)
    comparison_text = replace_scalar(
        comparison_text,
        "original_graph_sha256",
        sha256(outputs["original"]),
    )
    comparison_text = replace_scalar(
        comparison_text,
        "destination_graph_sha256",
        sha256(outputs["destination"]),
    )
    write_text(outputs["comparison"], comparison_text)

    sanitized_documents = {
        name: read_toml(path) for name, path in outputs.items()
    }
    validate_graph_rewrite(
        source_documents["monolith"],
        sanitized_documents["monolith"],
        monolith_map,
    )
    validate_graph_rewrite(
        source_documents["original"],
        sanitized_documents["original"],
        subservice_map,
    )
    validate_graph_rewrite(
        source_documents["destination"],
        sanitized_documents["destination"],
        subservice_map,
    )
    validate_comparison_rewrite(
        source_documents["comparison"],
        sanitized_documents["comparison"],
        subservice_map,
    )

    comparison_namespace = runpy.run_path(
        str(arguments.comparison_renderer)
    )
    read_comparison = comparison_namespace.get("read_comparison")
    if not callable(read_comparison):
        raise RuntimeError("Comparison validation API is unavailable.")
    read_comparison(outputs["comparison"], PUBLIC_SCOPE)

    html_outputs = (
        output_dir / "Monolith-tangled-tree.html",
        output_dir / "Subservice-original-tangled-tree.html",
        output_dir / "Subservice-destination-tangled-tree.html",
        output_dir / "Subservice-dependency-comparison.html",
    )
    generate_standalone_html(
        arguments.standalone_renderer,
        outputs["monolith"],
        html_outputs[0],
        "Monolith F# File Dependencies",
    )
    generate_standalone_html(
        arguments.standalone_renderer,
        outputs["original"],
        html_outputs[1],
        "Original Subservice F# File Dependencies",
    )
    generate_standalone_html(
        arguments.standalone_renderer,
        outputs["destination"],
        html_outputs[2],
        "Extracted Subservice F# File Dependencies",
    )
    generate_comparison_html(
        arguments.comparison_renderer,
        outputs["comparison"],
        html_outputs[3],
    )

    manifest = {
        "monolith_paths": monolith_map,
        "subservice_paths": subservice_map,
        "folder_aliases": {
            "/".join(key): value for key, value in folder_aliases.items()
        },
        "file_aliases": {
            "/".join(key): value for key, value in file_aliases.items()
        },
    }
    write_text(
        arguments.private_manifest,
        json.dumps(manifest, indent=2, sort_keys=True) + "\n",
    )

    public_files = [
        *outputs.values(),
        *html_outputs,
        Path(__file__),
        *arguments.scan_file,
    ]
    validate_no_disclosure(
        public_files,
        forbidden_tokens,
        private_identity_values(
            paths,
            roots,
            source_documents["comparison"],
        ),
    )

    print(
        "Generated publication-safe extraction artifacts: "
        f"{len(file_aliases)} files, {len(folder_aliases)} folders, "
        f"{len(outputs) + len(html_outputs)} graph artifacts."
    )


if __name__ == "__main__":
    main()
