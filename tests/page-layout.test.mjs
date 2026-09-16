import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import {footerBaseline} from '../dist/page-layout.mjs';

test('footers project to the same height across both books and viewport sizes',()=>{
 for(const count of [12,18])for(let n=0;n<count/2;n++)for(const aspect of [.6,1.32,2])for(const zoom of [.6,1,1.18]){
  const camera=new THREE.PerspectiveCamera(32,aspect,.1,50);camera.position.z=6.4;camera.zoom=zoom;camera.updateProjectionMatrix();camera.updateMatrixWorld();
  const root=new THREE.Group();root.rotation.x=.015;
  const left=new THREE.Group(),right=new THREE.Group();root.add(left,right);
  if(n===0){left.position.z=.145;left.rotation.y=-Math.PI;}
  else {left.position.z=.21+(n-1)*.004;left.rotation.y=-Math.PI;}
  right.position.z=.135-n*.004;root.updateMatrixWorld(true);
  const a=new THREE.Vector3(0,(.5-footerBaseline(n*2)/2100)*(n===0?3.02:2.91),n===0?-.0175:-.0006);
  const b=new THREE.Vector3(0,(.5-footerBaseline(n*2+1)/2100)*2.91,.0006);
  left.localToWorld(a);right.localToWorld(b);a.project(camera);b.project(camera);
  assert.ok(Math.abs(a.y-b.y)<1e-10,`spread ${n}, aspect ${aspect}`);
 }
});
