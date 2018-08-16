/*global chrome*/
/* src/content.js */
import * as $ from 'jquery'
import React from 'react';
import ReactDOM from 'react-dom';
import Axios from 'axios';
import Frame, { FrameContextConsumer }from 'react-frame-component';
import "./content.css";

// const ['qb', 'wr', 'rb', 'te'] = ;

export class Main extends React.Component {
	state = {
		waiting: false,
		currentDraftPosition: 1,
		draftedPlayers: null,
		rb: [],
		qb: [],
		te: [],
		wr: [],
		teams: {},
		draftOrder: [],
		staticDraftOrder: [],
		tab: 'tiers'
	}

	componentDidMount () {
		this.setState({waiting: true})
		Axios.get('http://localhost:3000/')
			.then(({data: {
				players: {
					rb,
					qb,
					te,
					wr,
				}
			}}) => this.setState({
					rb,
					qb,
					te,
					wr,
					waiting: false
				})
			)
		this.setTeams();
	}

	getDraftedPlayers = (pickIter) => {
		let {
			currentDraftPosition,
			draftOrder,
			teams
		} = this.state
		const playerElements = document.getElementsByClassName("first-name");
		let draftedPlayers = Array.prototype.map.call(playerElements, player => `${player.innerText} ${player.nextSibling.innerText}`);
		draftedPlayers = draftedPlayers.map(player => {
			player = player.replace(' Jr', '');
			if (!player) return '';
			player = player.replace(/[^A-Za-z0-9\s]/ig, '');
			return player;
		});
		if (pickIter) {
			const position = $(`#draft-cell-${currentDraftPosition}`).attr('class').split(' ')[1];
			const draftingTeam = draftOrder[currentDraftPosition % 12];
			teams[draftingTeam][position] += 1;
			if (currentDraftPosition % 12 === 0) draftOrder = draftOrder.reverse();
		}
		$(`#draft-cell-${currentDraftPosition}`).unbind("DOMNodeInserted");
		currentDraftPosition = parseInt(currentDraftPosition) +  pickIter;
		this.setState({
			draftedPlayers,
			currentDraftPosition,
			draftOrder
		});
	}

	setTeams = () => {
		let {
			draftOrder,
			teams,
			currentDraftPosition,
			staticDraftOrder
		} = this.state;

		// setup the team names and stats
		$('.team-column').each(function() {
			let teamName = Array.prototype.find.call(this.firstChild.children, (child) => child.className === 'team-name').innerText;
			if (teamName.indexOf('---') > -1) teamName = 'Team ' + (draftOrder.length +1);
			draftOrder.push(teamName);
			teams[teamName] = {
				qb: 0,
				rb: 0,
				wr: 0,
				te: 0
			};
		});
		staticDraftOrder = draftOrder
		// check if the draft is already in progress
		const currentPick = $('.current-pick');
		if (currentPick) {
			currentDraftPosition = currentPick.attr('id').replace('draft-cell-', '');
			for (let i = 1; i < currentDraftPosition; i++) {
				const position = $(`#draft-cell-${i}`).attr('class').split(' ')[1];
				const draftingTeam = draftOrder[i % 12];
				teams[draftingTeam][position] += 1;
				if (i % 12 === 0) draftOrder = draftOrder.reverse()
			}
		}
		this.setState({
			teams,
			draftOrder,
			staticDraftOrder,
			currentDraftPosition
		});
	}

    render() {
		const {
			waiting,
			draftedPlayers,
			currentDraftPosition,
			draftOrder,
			staticDraftOrder,
			teams,
			tab,
			...state
		} = this.state
		if (!waiting && !draftedPlayers) this.getDraftedPlayers(0);
		console.log(currentDraftPosition)
		$(`#draft-cell-${currentDraftPosition}`).bind("DOMNodeInserted",() => this.getDraftedPlayers(1));
        return (
            <Frame head={[<link type="text/css" rel="stylesheet" href={chrome.runtime.getURL("/static/css/content.css")} ></link>]}> 
               <FrameContextConsumer>
               {
               // Callback is invoked with iframe's window and document instances
                   ({document, window}) => {
                      // Render Children
                        return (
                           <div className={'my-extension'}>
								<div className="tab">
									<button className={tab === 'tiers' ? 'active' : ''} onClick={() => this.setState({tab: 'tiers'})}>Tiers</button>
									<button className={tab === 'team' ? 'active' : ''} onClick={() => this.setState({tab: 'team'})}>Team Stats</button>
								</div>
								<div className='flex-div'>
									{
										waiting && 
										<div>
											...Loading...
										</div>
									}
									{
										!waiting && tab === 'tiers' && ['qb', 'wr', 'rb', 'te'].map(position => (
											<div className='tier-column'>
												<h5 className='position-header'>{position} Current Tier: {state[position].filter(player => !draftedPlayers.includes(player.name))[0].tier || 1}</h5>
												{state[position].map((player, idx) => {
													let classNames = draftedPlayers.includes(player.name) ? 'picked ' : '';
													classNames += player.tier % 2 === 0 ? 'light-green' : 'dark-green';
													return (<div className={classNames}>
														{idx + 1}. {player.name}
													</div>)
												})}
											</div>)
										)
									}
									{
										!waiting && tab === 'team' && staticDraftOrder.map(team => (
											<div className='tier-column'>
												<small className='position-header'>{team}</small>
												{['qb', 'wr', 'rb', 'te'].map(position => (
													<div>{position}: {teams[team][position]}</div>
												))}
											</div>
										))
									}
								</div>
                           </div>
                        )
                    }
                }
                </FrameContextConsumer>
            </Frame>
        )
    }
}

const app = document.createElement('div');
app.id = "my-extension-root";

let visible = false

chrome.runtime.onMessage.addListener(
   function(request, sender, sendResponse) {
		if( request.message === "clicked_browser_action") {
			toggle();
		}
   }
);




function toggle(){
	if(!visible){
		visible = true
		document.body.appendChild(app);
		ReactDOM.render(<Main />, app);
	}else{
		visible = false
		document.body.removeChild(app);
	}
}
