export function nextState(state, event) {
  if(event.type==='close' && state.phase!=='shelf') return {...state,phase:'returning'};
  if(event.type==='select' && state.phase==='shelf' && [3,4,5].includes(event.id)) return {phase:'extracting',active:event.id};
  if(event.type==='open' && state.phase==='cover') return {...state,phase:'opening'};
  if(event.type==='settled') {
    const phases={extracting:'cover',opening:'open',returning:'shelf'};
    if(phases[state.phase]) return {phase:phases[state.phase],active:state.phase==='returning'?null:state.active};
  }
  return state;
}
