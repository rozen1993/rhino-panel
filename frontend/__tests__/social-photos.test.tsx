import {beforeEach,expect,it,vi} from 'vitest';
import {fireEvent,render,screen} from '@testing-library/react';
import {SocialPhotoAlbums} from '@/components/social-photo-albums';
import type {SocialAlbum} from '@/lib/social-photos';
import {roles} from '@/lib/roles';
import {destinationsFor} from '@/components/nav-bar';
vi.mock('next/navigation',()=>({useRouter:()=>({refresh:vi.fn()})}));
const albums:SocialAlbum[]=[{id:'activity-1',title:'Charla sintética',place:'Lugar de prueba',type:'Grabación',spans:[{start:'2026-04-12',end:'2026-04-12'}],photos:[{id:'photo-1',activity_id:'activity-1',caption:'Participantes del ejemplo',width:1000,height:700,byte_size:1000,state:'ready',version:2,archived_at:null,created_at:'2026-10-19T00:00:00Z'}]}];
beforeEach(()=>{HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};});
it('clasifica las fotos por fecha del trabajo, no por fecha de subida',()=>{
 render(<SocialPhotoAlbums albums={albums} today="2026-10-19"/>);
 expect(screen.getByText('No hay álbumes para estos filtros')).toBeTruthy();
 fireEvent.change(screen.getByLabelText('Mes de las fotos'),{target:{value:'2026-04'}});
 expect(screen.getByRole('button',{name:'Ver fotos de Charla sintética'})).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Ver fotos de Charla sintética'}));
 expect(screen.getByRole('dialog',{name:'Fotos de Charla sintética'})).toBeTruthy();
 expect(screen.getByRole('link',{name:'Descargar foto'}).getAttribute('href')).toBe('/api/fotos/photo-1?variant=download&v=2');
 fireEvent.click(screen.getByRole('button',{name:'Cerrar'}));expect(screen.queryByRole('dialog')).toBeNull();
});
it('muestra un estado vacío claro y la pestaña solo para Aunor',()=>{
 render(<SocialPhotoAlbums albums={[]} today="2026-10-19"/>);expect(screen.getByText('Todavía no hay fotos para redes')).toBeTruthy();
 expect(destinationsFor(roles.aunor).some(n=>n.href==='/aunor/fotos')).toBe(true);
 expect(destinationsFor(roles.operario).some(n=>n.href==='/aunor/fotos')).toBe(false);
});
