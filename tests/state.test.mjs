import test from 'node:test';
import assert from 'node:assert/strict';
import {nextState} from '../dist/state.mjs';
const shelf={phase:'shelf',active:null};
test('decorative books never leave shelf',()=>{for(const id of [1,2,6,7])assert.deepEqual(nextState(shelf,{type:'select',id}),shelf)});
test('two deliberate clicks are required and animation clicks are ignored',()=>{let s=nextState(shelf,{type:'select',id:4});assert.equal(s.phase,'extracting');assert.deepEqual(nextState(s,{type:'open'}),s);s=nextState(s,{type:'settled'});assert.equal(s.phase,'cover');s=nextState(s,{type:'open'});assert.equal(s.phase,'opening');assert.equal(nextState(s,{type:'settled'}).phase,'open')});
test('all three books can return from any active phase',()=>{for(const id of [3,4,5]){let s=nextState(shelf,{type:'select',id});s=nextState(s,{type:'close'});assert.equal(s.phase,'returning');assert.deepEqual(nextState(s,{type:'settled'}),shelf)}});
