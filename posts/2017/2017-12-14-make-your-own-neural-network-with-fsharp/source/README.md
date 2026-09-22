# Make Your Own Neural Network with F# source snapshot

This directory contains the F# source code that accompanies the [Make Your Own Neural Network with F# article](../index.md).

The source was imported from the original [`oleksandr-bilyk/MakeYourOwnNeuralNetwork`](https://github.com/oleksandr-bilyk/MakeYourOwnNeuralNetwork) repository at commit `3b1a5136834528048650961cf21b8b8f7c27f0c8`, committed on December 14, 2017.

The implementation was inspired by Tariq Rashid's book *Make Your Own Neural Network*. The original repository's Python reference file is not included in this snapshot; this directory contains only the F# implementation authored for the project.

## Source map

- `NeuralNetwork.fs` implements model creation, forward queries, recursive training, and reverse queries.
- `MnistDatabase.fs` reads compressed MNIST image and label files as reusable lazy sequences.
- `MnistDatabaseExtraction.fs` converts records to images and rotates images for augmentation.
- `MnistDatabaseNeuralNetwork.fs` connects the neural network to MNIST training, testing, augmentation, and pareidolia generation.
- `Program.fs` provides the console commands.

## Historical environment

The application targets .NET Core 2.0 and uses the dependency versions from the original 2017 project:

- MathNet.Numerics 3.20.0
- MathNet.Numerics.FSharp 3.20.0
- SixLabors.ImageSharp 1.0.0-beta0002

The original project used Paket. The project file in this snapshot uses equivalent `PackageReference` entries so that no Paket executables or restore cache need to be archived.

These historical dependencies are out of support and currently produce framework-compatibility and package-security warnings. A current .NET SDK can restore and compile the project, but you should not deploy the application or use it to process untrusted input. Updating the target framework and image library would require a separate modernization of the 2017 sample.

## MNIST data

The original repository included approximately 11 MB of compressed MNIST data. The blog snapshot excludes those generated/downloadable files.

Run the following command from this directory to create the expected `Data` directory:

```powershell
.\download-mnist.ps1
```

The script verifies each downloaded file against the SHA-256 checksum of the dataset files used by the original repository.

The application expects these files:

```text
Data/
├── train-images-idx3-ubyte.gz
├── train-labels-idx1-ubyte.gz
├── t10k-images-idx3-ubyte.gz
└── t10k-labels-idx1-ubyte.gz
```

The code is preserved as a historical educational sample, not as a current machine-learning framework or production implementation.

See [NOTICE.md](./NOTICE.md) for provenance and upstream-code attribution.

The original MIT license is preserved in [LICENSE](./LICENSE).
