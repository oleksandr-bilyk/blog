$ErrorActionPreference = "Stop"

$dataDirectory = Join-Path $PSScriptRoot "Data"
New-Item -ItemType Directory -Force -Path $dataDirectory | Out-Null

$baseUrl = "https://storage.googleapis.com/cvdf-datasets/mnist"
$files = @{
    "train-images-idx3-ubyte.gz" = "440fcabf73cc546fa21475e81ea370265605f56be210a4024d2ca8f203523609"
    "train-labels-idx1-ubyte.gz" = "3552534a0a558bbed6aed32b30c495cca23d567ec52cac8be1a0730e8010255c"
    "t10k-images-idx3-ubyte.gz" = "8d422c7b0a1c1c79245a5bcf07fe86e33eeafee792b84584aec276f5a2dbc4e6"
    "t10k-labels-idx1-ubyte.gz" = "f7ae60f92e00ec6debd23a6088c31dbd2371eca3ffa0defaefb259924204aec6"
}

foreach ($file in $files.Keys) {
    $destination = Join-Path $dataDirectory $file
    Write-Host "Downloading $file..."
    Invoke-WebRequest -Uri "$baseUrl/$file" -OutFile $destination

    $actualHash = (Get-FileHash $destination -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($actualHash -ne $files[$file]) {
        Remove-Item $destination
        throw "Checksum verification failed for $file."
    }
}

Write-Host "MNIST data downloaded to $dataDirectory."
