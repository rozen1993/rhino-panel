import {beforeEach,expect,it,vi} from 'vitest';
import {fireEvent,render,screen} from '@testing-library/react';
import {SocialPhotoAlbums} from '@/components/social-photo-albums';
import {safeOneDriveFolder,type SocialAlbum} from '@/lib/social-photos';
import {socialExamples} from '@/lib/social-examples';
import {roles} from '@/lib/roles';
import {destinationsFor} from '@/components/nav-bar';
vi.mock('next/navigation',()=>({useRouter:()=>({refresh:vi.fn()})}));
const albums:SocialAlbum[]=[{id:'activity-1',title:'Charla sintética',place:'Lugar de prueba',type:'Grabación',spans:[{start:'2026-04-12',end:'2026-04-12'}],photos:[],folderUrl:'https://example-my.sharepoint.com/:f:/g/folder'}];
beforeEach(()=>{HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};});
it('clasifica por fecha del trabajo y abre la carpeta específica, no una descarga',()=>{
 render(<SocialPhotoAlbums albums={albums} today="2026-10-20"/>);
 expect(screen.getByText('No hay álbumes para estos filtros')).toBeTruthy();
 fireEvent.change(screen.getByLabelText('Mes de las fotos'),{target:{value:'2026-04'}});
 const link=screen.getByRole('link',{name:'Abrir carpeta en OneDrive: Charla sintética'});
 expect(link.getAttribute('href')).toBe(albums[0].folderUrl);expect(link.getAttribute('target')).toBe('_blank');expect(link.getAttribute('rel')).toContain('noopener');expect(link.hasAttribute('download')).toBe(false);
 expect(screen.queryByText(/Descargar/)).toBeNull();
});
it('mantiene tres ejemplos separados, visibles con cualquier mes y sin vínculos inventados',()=>{
 render(<SocialPhotoAlbums albums={[]} examples={socialExamples} today="2027-01-20"/>);
 expect(screen.getByRole('heading',{name:'Social'})).toBeTruthy();
 expect(screen.getByText('0 carpetas vinculadas')).toBeTruthy();
 expect(screen.getAllByRole('article')).toHaveLength(3);
 expect(screen.getAllByRole('button',{name:'Carpeta pendiente'}).every(b=>b.hasAttribute('disabled'))).toBe(true);
 expect(screen.queryByRole('link')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Ver muestra de Charla de seguridad vial'}));
 expect(screen.getByRole('dialog',{name:'Muestra de Charla de seguridad vial'})).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Cerrar'}));expect(screen.queryByRole('dialog')).toBeNull();
});
it('no oculta errores de carga detrás de un falso estado vacío',()=>{
 render(<SocialPhotoAlbums albums={[]} examples={socialExamples} today="2026-10-20" loadError="Error consultando carpetas"/>);
 expect(screen.getByRole('alert').textContent).toBe('Error consultando carpetas');expect(screen.queryByText('Todavía no hay carpetas vinculadas')).toBeNull();expect(screen.getAllByRole('article')).toHaveLength(3);
});
it('la pestaña Social pertenece solo a Aunor',()=>{
 expect(destinationsFor(roles.aunor).find(n=>n.href==='/aunor/fotos')?.label).toBe('Social');
 expect(destinationsFor(roles.operario).some(n=>n.href==='/aunor/fotos')).toBe(false);
});
it.each(['https://1drv.ms/f/a','https://onedrive.live.com/?id=123','https://onedrive.live.com/redir?resid=123','https://empresa-my.sharepoint.com/:f:/g/personal/folder'])('valida host OneDrive: %s',url=>{
 expect(safeOneDriveFolder(url)).toBe(url);
});
it.each(['javascript:alert(1)','http://1drv.ms/f/a','https://1drv.ms/','https://1drv.ms.evil.example/f/a','https://user:pass@1drv.ms/f/a','https://evil.example/a','https://empresa.sharepoint.com:8443/f/a'])('rechaza enlace ajeno o inseguro: %s',url=>expect(safeOneDriveFolder(url)).toBeNull());
