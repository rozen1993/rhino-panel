import {SOCIAL_INPUT_MAX_BYTES,SOCIAL_MIN_SHORT_SIDE,SOCIAL_MIN_LONG_SIDE} from './social-photos';
export function socialFileError(file:Pick<File,'size'|'type'>):string|null {
 if(!file.size)return 'El archivo está vacío. Selecciona otra fotografía.';
 if(file.size>SOCIAL_INPUT_MAX_BYTES)return 'La foto supera 4 MB. Exporta una copia más ligera y conserva el original en OneDrive.';
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))return 'Formato no admitido. Elige JPG, PNG o WebP; no se aceptan HEIC, GIF, SVG ni documentos.';
 return null;
}
export function socialDimensionsError(width:number,height:number):string|null {
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)return 'No se pudieron leer las dimensiones de la foto.';
 if(width*height>40_000_000)return 'La foto supera 40 megapíxeles. Exporta una copia de menor resolución.';
 if(Math.min(width,height)<SOCIAL_MIN_SHORT_SIDE||Math.max(width,height)<SOCIAL_MIN_LONG_SIDE)return 'La resolución es insuficiente: necesitas al menos 1280 × 720 píxeles, en horizontal o vertical.';
 return null;
}
