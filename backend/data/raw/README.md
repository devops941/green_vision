# Raw Satellite Data Directory

This directory stores authentic raw multi-spectral satellite imagery files uploaded by the user or fetched from official space data repositories.

### Strict Data Policy:
1. **Authentic Multispectral Bands Only**:
   - Copernicus Sentinel-2: **Band 4 (Red)** and **Band 8 (NIR)**.
   - USGS Landsat 8/9: **Band 4 (Red)** and **Band 5 (NIR)**.
2. **Format**: GeoTIFF (`.tif`, `.tiff`) or JPEG 2000 (`.jp2`) with embedded CRS and georeference metadata.
3. **No Ordinary RGB Imagery**: Standard RGB JPEG/PNG camera images are strictly rejected by the validator.
4. **Geographical Scope**: Only imagery intersecting Madurai District boundaries (`77.68°E - 78.52°E`, `9.53°N - 10.35°N`) is accepted.
5. **No Fake Data**: Synthetic, random, or hardcoded raster data is strictly prohibited.
