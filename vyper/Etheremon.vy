# @version ^0.2.4

# Player information
struct Player:
    username: String[100]
    playerAddress: address
    opponentAddress: address
    wins: uint256
    health: int128
    turnCount: uint256
    isTurn: bool
    # as wei
    winnings: uint256
MAX_HEALTH: constant(uint256) = 500

MAX_PLAYERS: constant(uint256) = 10
players: public(Player[MAX_PLAYERS])
# Where to insert next player into players[]
playersIndex: public(uint256)

#Card information
struct Card:
    name: String[100]
    cardID: uint256
    attack: int128
    defense: int128
    #in wei
    price: uint256

# index = card ID
cards: public(Card[5])

# Map of user address -> list of cards owned
cardsOwned: public(HashMap[address, Card[5]])
# Keep track of Card[] index for each player
cardIndex: public(HashMap[address, uint256])
# Keep track of index in player[] for each player's address
addressIndex: public(HashMap[address, uint256])


# Event emitted to frontend when there is a change in a player's score
event Score:
    player: String[100]
    opponent: String[100]
    playerScore: int128
    opponentScore: int128
    playerAddress: address
    opponentAddress: address

# Event emitted to frontend when there is a change in player's turn
event Turn:
    isTurn: bool
    player: address

# Event emitted to frontend when a player initiates a game
event GameStart:
    player: address
    opponent: String[100]

# Event emitted to frontend when a player wins a game
event Winner:
    winner: String[100]
    player: address
    opponent: address

# Event emitted to frontend when there is an error in a game
event GameError:
    error: String[100]
    player: address

# Event emitted to frontend when there is an error with purchasing a card
event PurchaseError:
    error: String[100]
    player: address

# Initialize the contract
@external
@payable
def __init__():
	self.playersIndex = 0
    # Initialize the card list
	self.cards[0] = Card({attack: 100, defense: 40, price: 200000000000000000, name: "Card1", cardID: 0})
	self.cards[1] = Card({attack: 60, defense: 20, price: 100000000000000000, name: "Card2", cardID: 1})
	self.cards[2] = Card({attack: 80, defense: 40, price: 150000000000000000, name: "Card3", cardID: 2})
	self.cards[3] = Card({attack: 50, defense: 60, price: 100000000000000000, name: "Card4", cardID: 3})
	self.cards[4] = Card({attack: 125, defense: 20, price: 250000000000000000, name: "Card5", cardID: 4})

# Register a user
# Make sure that there aren't already MAX_PLAYERS registered
# Set up player's information and their cardIndex to 0
# Increment playersIndex for next player added
@external
@payable
def register(_username: String[100]):
    # If the maximum number of registered players has been reached,
    # first alert the frontend
    if self.playersIndex >= MAX_PLAYERS:
        log GameError("Unable to register: maximum players has been reached", msg.sender)
    # Then revert the transaction
    assert(self.playersIndex < MAX_PLAYERS)

    self.players[self.playersIndex] = Player({username: _username, playerAddress: msg.sender, opponentAddress: msg.sender, wins: 0, health: MAX_HEALTH, turnCount: 0, isTurn: False, winnings: 0})
    self.addressIndex[msg.sender] = self.playersIndex
    self.playersIndex += 1
    self.cardIndex[msg.sender] = 0

# Return the index of a player
# return: index of a player at _player address
#       -1 if the user has not registered
@internal
def getIndex(_player: address) -> int128:
    for i in range(0, MAX_PLAYERS):
            if self.players[i].playerAddress == _player:
                return i
    return -1

# Check if a user owns a card
# Return true if they do, false if they do not
@internal
def ownsCard(_player: address, _cardID: uint256) -> bool:
    index: uint256 = self.cardIndex[_player]
    for i in range(0, 5):
        if self.cardsOwned[_player][i].name == self.cards[_cardID].name:
            return True
    return False

# Buy a card and add it to user's cardList, cardsOwned[user address]
@external
@payable
def buy(_cardID: uint256) -> bool:
    # Log all errors and revert via assert
    # Check if user is registered
    if self.getIndex(msg.sender) == -1:
        log GameError("Please register before purchasing any cards", msg.sender)
        return False
    assert self.getIndex(msg.sender) != -1
    
    # Check if user already owns the card
    if self.ownsCard(msg.sender, _cardID) == True:
        log GameError("You already own this card", msg.sender)
        return False
    assert self.ownsCard(msg.sender, _cardID) != True

    # Check if user has paid enough
    if msg.value < self.cards[_cardID].price:
        log PurchaseError("Please include sufficient funds in your transaction", msg.sender)
        return False
    assert msg.value >= self.cards[_cardID].price

    assert _cardID >= 0
    assert _cardID <= 4
    assert self.cardIndex[msg.sender] < 5

    # Add requested card to next position in user's card list
    self.cardsOwned[msg.sender][self.cardIndex[msg.sender]] = self.cards[_cardID]
    self.cardIndex[msg.sender] += 1
    return True

# Initiate a game with an opponent based on their address
@external
@payable
def start(_opponent: address) -> bool:
    if self.getIndex(msg.sender) == -1:
        log GameError("Please register before playing", msg.sender)
        return False
    
    if self.getIndex(_opponent) == -1:
        log GameError("Please make sure opponent has registered", msg.sender)
        return False

    # User must pay .1 ETH to play a game
    assert msg.value >= 100000000000000000

    # Find the player initiating the game and set their opponent
    # set opponent's opponentAddress to initiating player
    index: int128 =  self.getIndex(msg.sender)
    self.players[index].opponentAddress = _opponent
    opponentIndex: int128 = self.getIndex(_opponent)
    self.players[opponentIndex].opponentAddress = msg.sender

    # Notify opponent
    log GameStart(_opponent, self.players[index].username)
        
    self.players[index].isTurn = True
    log Turn(True, msg.sender)
    log Turn(False, _opponent)

    log Score(self.players[index].username, self.players[opponentIndex].username, self.players[index].health, self.players[opponentIndex].health, msg.sender, _opponent)
    return True

# Update a player's winnings balance after they win a game with +.15 ETH
@internal
def updateWinnerBalance(_user: address):
    index: int128 = self.getIndex(_user)
    # Add .15 ETH in WEI
    self.players[index].winnings += 150000000000000000

# Send a player's winnings balance to their address
@external
def cashout():
    index: int128 = self.getIndex(msg.sender)
    assert index != -1
    amount: uint256 = self.players[index].winnings
    self.players[index].winnings = 0
    send(msg.sender, amount)

# Reset a player to default values
@internal
def reset(_index: int128, _opponentIndex: int128):
    self.players[_index].opponentAddress = self.players[_index].playerAddress
    self.players[_index].health = MAX_HEALTH
    self.players[_index].turnCount = 0
    self.players[_index].isTurn = False
    self.players[_opponentIndex].opponentAddress = self.players[_opponentIndex].playerAddress
    self.players[_opponentIndex].health = MAX_HEALTH
    self.players[_opponentIndex].turnCount = 0
    self.players[_opponentIndex].isTurn = False
 
 # Check if a player is already in a game. 
 # Return true if they are and false if they are not.
@internal
def inGame(_index: int128) -> bool:
    if self.players[_index].playerAddress == self.players[_index].opponentAddress:
         return False
    return True      

# See if a player has won
# True if opponent's health == 0.
@internal
def checkWin(_index: int128, _opponentIndex: int128) -> bool:
    if self.players[_opponentIndex].health <= 0:
        self.players[_index].wins += 1
        return True
    return False

# Make a game move
# Given a cardID and whether a player is attacking,
# Find the card and either subtract the attack amount from opponent's health (if _isAttacking)
# or add the defense amount to the player's health (if !_isAttacking)
@external
def play(_cardID: uint256, _isAttacking: bool) -> bool:
    card: Card = self.cards[_cardID]

    index: int128 = self.getIndex(msg.sender)

    if index == -1:
        log GameError("Please register before playing", msg.sender)
        return False

    if self.inGame(index) == False:
        log GameError("You have not yet initiated a game", msg.sender)

    opponentIndex: int128 = self.getIndex(self.players[index].opponentAddress)
    if opponentIndex == -1:
        log GameError("Please make sure your opponent has registered", msg.sender)
        return False

    if self.players[index].isTurn == False:
        log GameError("Please wait your turn", msg.sender)
        return False

    self.players[index].turnCount += 1

    if _isAttacking:
            self.players[opponentIndex].health -= card.attack
            if self.players[opponentIndex].health < 0:
                self.players[opponentIndex].health = 0
    else:
        self.players[index].health += card.defense
        if self.players[index].health > MAX_HEALTH:
            self.players[index].health = MAX_HEALTH

    self.players[index].isTurn = False
    self.players[opponentIndex].isTurn = True

    log Score(self.players[index].username, self.players[opponentIndex].username, self.players[index].health, self.players[opponentIndex].health, msg.sender, self.players[opponentIndex].playerAddress)

    if self.checkWin(index, opponentIndex) == True:
                log Winner(self.players[index].username, msg.sender, self.players[opponentIndex].playerAddress)
                self.updateWinnerBalance(msg.sender)
                self.reset(index, opponentIndex)
    log Turn(False, msg.sender)
    log Turn(True, self.players[opponentIndex].playerAddress)
    return True
