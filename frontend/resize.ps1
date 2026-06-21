Add-Type -AssemblyName System.Drawing
function Resize-Image {
    param(
        [string],
        [string],
        [int]
    )
    $img = [System.Drawing.Image]::FromFile($Src)
    $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
    $graph = [System.Drawing.Graphics]::FromImage($bmp)
    $graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graph.DrawImage($img, 0, 0, $Size, $Size)
    $bmp.Save($Dest, [System.Drawing.Imaging.ImageFormat]::Png)
    $graph.Dispose()
    $bmp.Dispose()
    $img.Dispose()
}

$srcImg = "c:\Users\Admin\Desktop\CampNav\frontend\public\icon-192.png"
Resize-Image $srcImg "c:\Users\Admin\Desktop\CampNav\frontend\public\icon-192-resized.png" 192
Resize-Image $srcImg "c:\Users\Admin\Desktop\CampNav\frontend\public\icon-512-resized.png" 512
Resize-Image $srcImg "c:\Users\Admin\Desktop\CampNav\frontend\public\shortcuts\map-96.png" 96
Resize-Image $srcImg "c:\Users\Admin\Desktop\CampNav\frontend\public\shortcuts\report-96.png" 96
Resize-Image $srcImg "c:\Users\Admin\Desktop\CampNav\frontend\public\shortcuts\emergency-96.png" 96
