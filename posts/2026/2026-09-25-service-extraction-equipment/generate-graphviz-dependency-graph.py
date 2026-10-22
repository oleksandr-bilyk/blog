#!/usr/bin/env python3
"""Convert a file-dependency TOML document to Graphviz DOT."""

from __future__ import annotations

import argparse
import math
from pathlib import Path, PurePosixPath
import tomllib
from typing import Mapping


LAYER_COLORS = {
    "Model": ("#dbeafe", "#1d4ed8"),
    "Services": ("#dcfce7", "#15803d"),
    "Infrastructure": ("#ffedd5", "#c2410c"),
    "WebApi": ("#f3e8ff", "#7e22ce"),
    "Root": ("#f3f4f6", "#4b5563"),
}


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="Dependency TOML file")
    parser.add_argument("output", type=Path, help="Graphviz DOT output file")
    parser.add_argument(
        "--layout",
        choices=("clustered", "dag"),
        default="clustered",
        help="Graph layout strategy (default: clustered)",
    )
    return parser.parse_args()


def quote(value: object) -> str:
    escaped = (
        str(value)
        .replace("\\", "\\\\")
        .replace('"', '\\"')
        .replace("\r", "")
        .replace("\n", "\\n")
    )
    return f'"{escaped}"'


def layer_and_label(path: str) -> tuple[str, str]:
    parts = PurePosixPath(path.replace("\\", "/")).parts
    try:
        root_index = parts.index("Monolith")
    except ValueError:
        return "Root", "/".join(parts)

    relative = parts[root_index + 1 :]
    layer = relative[0] if relative and relative[0] in LAYER_COLORS else "Root"
    label_parts = relative[1:] if layer != "Root" else relative
    return layer, "/".join(label_parts)


def dependency_label(metrics: Mapping[str, object]) -> str:
    names = {"calls": "calls", "constructs": "new", "references": "refs"}
    return ", ".join(
        f"{names.get(name, name)}: {value}"
        for name, value in metrics.items()
        if isinstance(value, int) and value > 0
    )


def topological_depths(
    file_ids: set[str], dependencies: Mapping[str, object]
) -> dict[str, int]:
    targets_by_source = {file_id: [] for file_id in file_ids}
    for dependency_id in dependencies:
        source, separator, target = str(dependency_id).partition("_")
        if not separator or source not in file_ids or target not in file_ids:
            raise ValueError(f"Invalid dependency key: {dependency_id!r}")
        targets_by_source[source].append(target)

    depths: dict[str, int] = {}
    visiting: list[str] = []

    def visit(file_id: str) -> int:
        if file_id in depths:
            return depths[file_id]
        if file_id in visiting:
            cycle_start = visiting.index(file_id)
            cycle = " -> ".join((*visiting[cycle_start:], file_id))
            raise ValueError(f"Dependency graph contains a cycle: {cycle}")

        visiting.append(file_id)
        targets = targets_by_source[file_id]
        depth = 0 if not targets else 1 + max(visit(target) for target in targets)
        visiting.pop()
        depths[file_id] = depth
        return depth

    for file_id in sorted(file_ids, key=int):
        visit(file_id)
    return depths


def render(document: Mapping[str, object], title: str, layout: str) -> str:
    files = document.get("files")
    dependencies = document.get("dependencies")
    if not isinstance(files, dict) or not isinstance(dependencies, dict):
        raise ValueError("Input must contain [files] and [dependencies] tables.")

    file_ids = {str(file_id) for file_id in files}
    grouped: dict[str, list[tuple[str, str, str]]] = {
        layer: [] for layer in LAYER_COLORS
    }
    for file_id, path_value in files.items():
        file_id = str(file_id)
        path = str(path_value)
        layer, label = layer_and_label(path)
        grouped[layer].append((file_id, label, path))

    lines = [
        "digraph FileDependencies {",
        f"  graph [label={quote(title)}, labelloc=t, fontsize=24, fontname={quote('Segoe UI')},",
        (
            '         rankdir=BT, compound=true, concentrate=true, overlap=false,'
            if layout == "clustered"
            else '         rankdir=LR, concentrate=true, overlap=false,'
        ),
        '         splines=polyline, nodesep=0.16, ranksep=0.7, bgcolor="transparent",',
        '         pad=0.25];',
        '  node [shape=box, style="rounded,filled", fontsize=9, fontname="Segoe UI",',
        '        margin="0.08,0.04", penwidth=1.1];',
        '  edge [arrowsize=0.55, color="#64748b80", fontname="Segoe UI", fontsize=7];',
        "",
    ]

    if layout == "clustered":
        for layer, nodes in grouped.items():
            if not nodes:
                continue
            fill, border = LAYER_COLORS[layer]
            lines.extend(
                [
                    f"  subgraph cluster_{layer.lower()} {{",
                    f"    label={quote(layer)};",
                    f"    color={quote(border)};",
                    '    style="rounded,dashed";',
                    "    penwidth=1.4;",
                ]
            )
            for file_id, label, path in nodes:
                lines.append(
                    f"    n{file_id} [label={quote(label)}, tooltip={quote(path)}, "
                    f"fillcolor={quote(fill)}, color={quote(border)}];"
                )
            lines.extend(["  }", ""])
    else:
        for layer, nodes in grouped.items():
            fill, border = LAYER_COLORS[layer]
            for file_id, label, path in nodes:
                lines.append(
                    f"  n{file_id} [label={quote(label)}, tooltip={quote(path)}, "
                    f"fillcolor={quote(fill)}, color={quote(border)}];"
                )
        lines.append("")

        depths = topological_depths(file_ids, dependencies)
        nodes_by_depth: dict[int, list[str]] = {}
        for file_id, depth in depths.items():
            nodes_by_depth.setdefault(depth, []).append(file_id)
        for depth, node_ids in sorted(nodes_by_depth.items()):
            ranked_nodes = "; ".join(
                f"n{file_id}" for file_id in sorted(node_ids, key=int)
            )
            lines.append(
                f"  subgraph rank_{depth} {{ rank=same; {ranked_nodes}; }}"
            )
        lines.append("")

    for dependency_id, metrics_value in dependencies.items():
        source, separator, target = str(dependency_id).partition("_")
        if not separator or source not in file_ids or target not in file_ids:
            raise ValueError(f"Invalid dependency key: {dependency_id!r}")
        if not isinstance(metrics_value, dict):
            raise ValueError(f"Dependency {dependency_id!r} must be a table.")

        total = sum(
            value
            for value in metrics_value.values()
            if isinstance(value, int) and value > 0
        )
        label = dependency_label(metrics_value)
        penwidth = min(4.0, 0.7 + math.log2(total + 1) * 0.35)
        edge_from, edge_to = (
            (target, source) if layout == "dag" else (source, target)
        )
        lines.append(
            f"  n{edge_from} -> n{edge_to} [penwidth={penwidth:.2f}, "
            f"tooltip={quote(label)}];"
        )

    lines.extend(["}", ""])
    return "\n".join(lines)


def main() -> None:
    arguments = parse_arguments()
    document = tomllib.loads(arguments.input.read_text(encoding="utf-8-sig"))
    title = arguments.input.stem.replace("-", " ")
    if arguments.layout == "dag":
        title += " - topological DAG"
    output = render(document, title, arguments.layout)
    arguments.output.write_text(output, encoding="utf-8", newline="\n")


if __name__ == "__main__":
    main()
