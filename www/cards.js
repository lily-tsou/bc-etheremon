/* ================================================================================*/
/* Javascript code for Etheremon DApp
/* ================================================================================*/

/* Check if Metamask is installed. */
if (typeof window.ethereum !== 'undefined') {
	console.log('MetaMask is installed!');
} else {
	console.log('Please install MetaMask or another browser-based wallet');
}

/* Instantiate a Web3 client that uses Metamask for transactions.  Then,
 * enable it for the site so user can grant permissions to the wallet */
const web3 = new Web3(window.ethereum);
window.ethereum.enable();

/* Grab ABI from compiled contract (e.g. in Remix) and fill it in.
 * Grab address of contract on the blockchain and fill it in.
 * Use the web3 client to instantiate the contract within program */
var CardsABI = [{"name":"Score","inputs":[{"type":"string","name":"player","indexed":false},{"type":"string","name":"opponent","indexed":false},{"type":"int128","name":"playerScore","indexed":false},{"type":"int128","name":"opponentScore","indexed":false},{"type":"address","name":"playerAddress","indexed":false},{"type":"address","name":"opponentAddress","indexed":false}],"anonymous":false,"type":"event"},{"name":"Turn","inputs":[{"type":"bool","name":"isTurn","indexed":false},{"type":"address","name":"player","indexed":false}],"anonymous":false,"type":"event"},{"name":"GameStart","inputs":[{"type":"address","name":"player","indexed":false},{"type":"string","name":"opponent","indexed":false}],"anonymous":false,"type":"event"},{"name":"Winner","inputs":[{"type":"string","name":"winner","indexed":false},{"type":"address","name":"player","indexed":false},{"type":"address","name":"opponent","indexed":false}],"anonymous":false,"type":"event"},{"name":"GameError","inputs":[{"type":"string","name":"error","indexed":false},{"type":"address","name":"player","indexed":false}],"anonymous":false,"type":"event"},{"name":"PurchaseError","inputs":[{"type":"string","name":"error","indexed":false},{"type":"address","name":"player","indexed":false}],"anonymous":false,"type":"event"},{"outputs":[],"inputs":[],"stateMutability":"payable","type":"constructor"},{"name":"register","outputs":[],"inputs":[{"type":"string","name":"_username"}],"stateMutability":"payable","type":"function","gas":464525},{"name":"buy","outputs":[{"type":"bool","name":""}],"inputs":[{"type":"uint256","name":"_cardID"}],"stateMutability":"payable","type":"function","gas":562405},{"name":"start","outputs":[{"type":"bool","name":""}],"inputs":[{"type":"address","name":"_opponent"}],"stateMutability":"payable","type":"function","gas":216897},{"name":"cashout","outputs":[],"inputs":[],"stateMutability":"nonpayable","type":"function","gas":69403},{"name":"play","outputs":[{"type":"bool","name":""}],"inputs":[{"type":"uint256","name":"_cardID"},{"type":"bool","name":"_isAttacking"}],"stateMutability":"nonpayable","type":"function","gas":609745},{"name":"players","outputs":[{"type":"string","name":"username"},{"type":"address","name":"playerAddress"},{"type":"address","name":"opponentAddress"},{"type":"uint256","name":"wins"},{"type":"int128","name":"health"},{"type":"uint256","name":"turnCount"},{"type":"bool","name":"isTurn"},{"type":"uint256","name":"winnings"}],"inputs":[{"type":"uint256","name":"arg0"}],"stateMutability":"view","type":"function","gas":17123},{"name":"playersIndex","outputs":[{"type":"uint256","name":""}],"inputs":[],"stateMutability":"view","type":"function","gas":1511},{"name":"cards","outputs":[{"type":"string","name":"name"},{"type":"uint256","name":"cardID"},{"type":"int128","name":"attack"},{"type":"int128","name":"defense"},{"type":"uint256","name":"price"}],"inputs":[{"type":"uint256","name":"arg0"}],"stateMutability":"view","type":"function","gas":14236},{"name":"cardsOwned","outputs":[{"type":"string","name":"name"},{"type":"uint256","name":"cardID"},{"type":"int128","name":"attack"},{"type":"int128","name":"defense"},{"type":"uint256","name":"price"}],"inputs":[{"type":"address","name":"arg0"},{"type":"uint256","name":"arg1"}],"stateMutability":"view","type":"function","gas":14481},{"name":"cardIndex","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"address","name":"arg0"}],"stateMutability":"view","type":"function","gas":1816},{"name":"addressIndex","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"address","name":"arg0"}],"stateMutability":"view","type":"function","gas":1846}]
var Cards = new web3.eth.Contract(CardsABI,'0x380870eDe48862F5DaA5c574051a36c591cD1Be8');

/* Load all cards in Etheremon catalog */
async function loadCards(){
	const cardsNode = document.getElementById("cards");

	for (var i = 0 ; i < 5; i++) {
		var card = await Cards.methods.cards(i).call();
		populateCard(card, cardsNode, false);
	}
}

/* Load all cards that a player has purchased */
async function loadOwned(){
	const cardsNode = document.getElementById("deck");
	const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
	const account = accounts[0];
	let numOwned = await Cards.methods.cardIndex(account).call();

	if(numOwned == 0){
		document.getElementById("deckInfo").style.display = "block"
	}
	else{
		document.getElementById("deckInfo").style.display = "none"
		for (var i = 0 ; i < numOwned; i++) {
			var card = await Cards.methods.cardsOwned(account, i).call();
			populateCard(card, cardsNode, true);
		}
	}
}

/* Populates the HTML elements corresponding with an Etheremon card
 * params:
 * 	card: Etheremon card from the blockchain contract
 * 	cardsNode: HTML element to append cards to
 * 	isOwned: Whether or not this is being called for cards owned or the catalog
 * 		if isOwned: The card will not display price, and attack/defense will be clickable buttons
 * 		if !isOwned: The card will display price, and attack/defense will be text only
 * */
function populateCard(card, cardsNode, isOwned){
	let name = document.createElement("P");
	name.innerText = card.name;
	name.setAttribute("id", "cardName");

	let ID = document.createElement("P");
	ID.innerText = "ID: " + card.cardID;
	ID.setAttribute("id", "idClass");

	let infoContainer = document.createElement("div")
	infoContainer.setAttribute("class", "infoContainer");

	if(!isOwned){
		var price = document.createElement("button");
		let ethPrice = card.price/10**18
		price.innerText = "Buy: " + ethPrice + " ETH";
		var id = "price"+card.cardID;
		price.setAttribute("id", id);
		price.setAttribute("class", "cardButton");
		infoContainer.appendChild(price);
		var attack = document.createElement("P");
		attack.setAttribute("class", "inactiveButton");
		var defense = document.createElement("P");
		defense.setAttribute("class", "inactiveButton");
	}

	else {
		var attack = document.createElement("button");
		attack.setAttribute("class", "cardButton");
		var defense = document.createElement("button");
		defense.setAttribute("class", "cardButton");
	}

	attack.innerText = "Attack: " + card.attack;
	var id = "attack"+card.cardID;
	attack.setAttribute("id", id);

	defense.innerText = "Defense: " + card.defense;
	var id = "defense"+card.cardID;
	defense.setAttribute("id", id);

	var buttonContainer = document.createElement("div")
	buttonContainer.setAttribute("class", "buttonContainer");
	buttonContainer.appendChild(attack);
	buttonContainer.appendChild(defense);

	infoContainer.appendChild(ID);

	var cardDiv = document.createElement("div")
	cardDiv.setAttribute("class", "card");

	var img = document.createElement("img");
	img.setAttribute("class", "image");
	img.src = "https://purepng.com/public/uploads/large/51502308190ywg3xhop2e1u94ebcskyi25hrgeulctsuiw8g47ix8ok1w14mfxodwoq2gi80jzib2nrc9wanirro49nakdq3pgz2qcufshojrjc.png";

	cardDiv.appendChild(img);
	cardDiv.appendChild(name);
	cardDiv.appendChild(buttonContainer)
	cardDiv.appendChild(infoContainer)
	cardsNode.appendChild(cardDiv);
}

/* Check if a user is in a game. If so, display the current score and turn */
async function loadGame() {
	const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
	const account = accounts[0];
	let index = await Cards.methods.addressIndex(account).call();
	let player = await Cards.methods.players(index).call();
	let opponentAddress = player.opponentAddress;

	//Player is in a game
	if (account != opponentAddress && opponentAddress != 0){
		let opponentIndex = await Cards.methods.addressIndex(opponentAddress).call();
		let playerScore = player.health;
		let opponent = await Cards.methods.players(opponentIndex).call();
		let opponentScore = opponent.health;
		let opponentName = opponent.username;
		let playerName = player.username;

		displayScore(playerName, opponentName, playerScore, opponentScore);

		let isTurn = player.isTurn;
		displayTurn(isTurn);
	}
}

/* Display number of games won and total winnings amount*/
async function loadWinnings() {
	const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
	const account = accounts[0];
	let index = await Cards.methods.addressIndex(account).call();
	let player = await Cards.methods.players(index).call();
	let wins = player.wins.toString();
	let winnings = player.winnings.toString();
	document.getElementById("gamesWon").innerHTML = "Games Won: " + player.wins.toString();	
	document.getElementById("totalWinnings").innerHTML = "Total Winnings: " + player.winnings.toString() + "WEI";	
}

/* Register account. Adds user to the contract player list */
async function register() {
	const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
	const account = accounts[0];
	const username = document.getElementById("username").value;
	const transactionParameters = {
		from: account,
		gasPrice: 0x1D91CA3600,
	};

	await Cards.methods.register(username).send(transactionParameters);

	laodWinnings();
};

/* Initiate a game with a player, given their address. A player must pay .1 ETH to challenge an opponent */
async function play() {
	const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
	const account = accounts[0];
	const opponent = document.getElementById("opponent").value;

	document.getElementById("turnWinner").style.display = "none"

	const transactionParameters = {
		from: account,
		gasPrice: 0x1D91CA3600,
		value: 100000000000000000
	};
	await Cards.methods.start(web3.utils.toChecksumAddress(opponent)).send(transactionParameters);
};

/* Register a game move and send it to the blockchain. 
 * params: 
 * 	cardMove: ID of card being called
 * 	isAttacking: bool, true if user selected attack, false if user selected defense
 * */
async function move(cardMove, isAttacking) {
	var cardID
	if (isAttacking){
		cardID = cardMove[6]
	}
	else{
		cardID = cardMove[7]
	}
	const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
	const account = accounts[0];

	const transactionParameters = {
		from: account,
		gasPrice: 0x1D91CA3600,
	};

	await Cards.methods.play(parseInt(cardID), isAttacking).send(transactionParameters);
};

/* Purchase a card from the contract
 * params:
 * 	cardID: ID of card to purchase
 * */
async function buy(cardID) {
	let id = cardID[5]
	const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
	const account = accounts[0];
	var card = await Cards.methods.cards(id).call();
	let price = card.price;

	const transactionParameters = {
		from: account,
		gasPrice: 0x1D91CA3600,
		value: price,
	};

	let success = await Cards.methods.buy(id).send(transactionParameters);
	if(success){
		loadOwned();
	}
};

/* Update the user's turn
 * params:
 * 	isTurn: true if it is the player's turn, false if it is not
 * 	player: Address of player whose turn has changed
 * */
async function updateTurn(isTurn, player) {
	const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
	if (web3.utils.toChecksumAddress(accounts[0]) == web3.utils.toChecksumAddress(player)) {
		displayTurn(isTurn);
	}
}

/* Change display showing whose turn it is
 * params:
 * 	isTurn: ture if is the player's turn, false if it is not
 * */
function displayTurn(isTurn){
	if(!isTurn){
		document.getElementById("turnWinner").style.display = "block"
		document.getElementById("turnWinnerText").innerHTML = "Please wait your turn"
	}
	else {
		document.getElementById("turnWinner").style.display = "block"
		document.getElementById("turnWinnerText").innerHTML = "Your turn"
	}

}

/* Update a game error
 * params:
 * 	error: Game error from contract
 * 	player: Player to alert of an error
 * */
async function updateError(error, player) {
	const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
	if (web3.utils.toChecksumAddress(accounts[0]) == web3.utils.toChecksumAddress(player)) {
		alert(error);
	}
}

/* Notify a player if a game has been initiated with them
 * params:
 * 	player: Player to be notified
 * 	opponent: Player who has challenged them.
 * */
async function updateStart(player, opponent) {
	const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
	if (web3.utils.toChecksumAddress(accounts[0]) == web3.utils.toChecksumAddress(player)) {
		alert(opponent.toString() + " has started a game with you")
	}
}

/* Update the score for user's whose game state has changed
 * params:
 * 	player: player who made the game move
 * 	opponent: player's opponent
 * 	pScore: player's new score
 * 	oScore: opponent's new score
 * 	playerAddress: player's address
 * 	opponentAddress: opponent's address
 * */
async function updateScore(player, opponent, pScore, oScore, playerAddress, opponentAddress){
	const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
	if (web3.utils.toChecksumAddress(accounts[0]) == web3.utils.toChecksumAddress(playerAddress) || web3.utils.toChecksumAddress(accounts[0]) == web3.utils.toChecksumAddress(opponentAddress)) {
		displayScore(player, opponent, pScore, oScore);
	}
}

/* Display the score to a player
 * params:
 * 	player: current player
 * 	opponent: player's opponent
 * 	pScore: player's score
 * 	oScore: opponent's score
 * */
async function displayScore(player, opponent, pScore, oScore){
	document.getElementsByClassName("playerScore")[0].style.display = "block"
	document.getElementsByClassName("playerScore")[1].style.display = "block"
	document.getElementById("player").innerHTML = player;
	document.getElementById("playerScore").innerHTML = pScore;
	document.getElementById("opponentName").innerHTML = opponent;
	document.getElementById("opponentScore").innerHTML = oScore;

}

/* Update UI to indicate winner */
async function updateWinner(winner, player, opponent){
	const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
	if (web3.utils.toChecksumAddress(accounts[0]) == web3.utils.toChecksumAddress(player) || web3.utils.toChecksumAddress(accounts[0]) == web3.utils.toChecksumAddress(opponent) ) {
		document.getElementById("turnWinner").style.display = "block"
		document.getElementById("turnWinnerText").innerHTML = winner.toString() + " wins!"

	}
}

/* Send all winnings to  player */
async function cashout(){
	const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
	const account = accounts[0];
	const transactionParameters = {
		from: account,
		gasPrice: 0x1D91CA3600,
	};
	await Cards.methods.cashout().send(transactionParameters);
	loadWinnings();
}

/* Create a register_button. Then, register an event  listener on it to invoke register() 
 * when it is clicked
 * */
const register_button = document.getElementById('register');
register_button.addEventListener('click', () => {
	register();
});

/* Create a play. Then, register an event  listener on it to invoke play() 
 * when it is clicked
 * */
const play_button = document.getElementById('play');
play_button.addEventListener('click', () => {
	play();
});

/* Create a cashout_button. Then, register an event  listener on it to invoke cashout() 
 * when it is clicked
 * */
const cashout_button = document.getElementById('cashout');
cashout_button.addEventListener('click', () => {
	cashout();
});

/* Listen to events for when a button is clicked on a card and call the appropriate function */
document.body.addEventListener( 'click', function ( event ) {
	if( event.target.id.indexOf("attack") >= 0 && event.target.type.toString() == "submit") {
		move(event.target.id, true);
	}
	else if( event.target.id.indexOf("defense") >= 0 && event.target.type.toString() == "submit") {
		move(event.target.id, false);
	}
	else if( event.target.id.indexOf("price") >= 0 ) {
		buy(event.target.id);
	}
} );

/* Register a handler for when contract emits a Turn event after a player's turn has changed */
Cards.events.Turn().on("data", function(event) {
	args = event.returnValues
	updateTurn(args.isTurn, args.player);
});

/* Register a handler for when contract emits a Score event after a player's score has changed */
Cards.events.Score().on("data", function(event) {
	args = event.returnValues
	updateScore(args.player, args.opponent, args.playerScore, args.opponentScore, args.playerAddress, args.opponentAddress);
});

/* Register a handler for when contract emits a Winner event after a player has wong a game */
Cards.events.Winner().on("data", function(event) {
	args = event.returnValues
	updateWinner(args.winner, args.player, args.opponent);
});

/* Register a handler for when contract emits a GameError event after the contract has encountered an error */
Cards.events.GameError().on("data", function(event) {
	args = event.returnValues
	updateError(args.error, args.player);
});

/* Register a handler for when contract emits a GameStart event after a player has initiated a game */
Cards.events.GameStart().on("data", function(event) {
	args = event.returnValues
	updateStart(args.player, args.opponent);
});
