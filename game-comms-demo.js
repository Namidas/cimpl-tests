/*simple post/recieve window messages to connect outsourced games with Ceredis client app*/
var $_CURRENT_USER = undefined;
var $_CURRENT_SCORE = 0;
var $_GAME_CONFIG = undefined;
var $_GAME = undefined;

/*I'll use this through the example as the instance of the game itself*/
var myGame;

/*util function used to post messages to the window.parent*/
function sendMessage(message)
{
	window.parent.postMessage(message,'*');
}

/*this is essentially a big switch with the possible "actions" that
window.parent might send us*/
function recieveMessage(event)
{
	switch(event.data.action)
	{
		case 'setCurrentUser':
			$_CURRENT_USER = event.data.payload;
			getGameConfig();
			break;
			
		case 'setGameConfig':
			$_GAME_CONFIG = event.data.payload;
			gameStart();
			break;
			
		case 'setRecharge':
			var money = event.data.payload;
			if(myGame !== null){
                //for instance tell the game to update credits
				myGame.setMoney(iMoney);
				$_CURRENT_SCORE = iMoney;
                //for instance tell the game to enable spins again
				myGame.enableSpin();
			}
			break;
			
		case 'onSpinConfirm':
            /*tell the game to run the spin itself*/
			myGame.onSpinConfirm();
			break;
	}
}

/*helper function to generate the gameEnd() if it must,
could be avoided and just generate whatever inside the recieveMessage() helper*/
function getGameConfig()
{
	if($_CURRENT_USER === undefined) return gameEnd('no.user');
	sendMessage({action:'getGameConfig'});
}	

/*helper function to post a gameEnd message with the given code/reason*/
function gameEnd(code)
{
	sendMessage({action:'gameEnd' , code: code});
}

/*start the game the game now that we have player info a game config*/
function gameStart()
{
	if($_CURRENT_USER === undefined) return gameEnd('no.user');
	if($_GAME_CONFIG === undefined) return gameEnd('no.config');
	
    myGame = new GAME($_GAME_CONFIG);

    /*assuming the game fires a "recharge" event, we listen to it, and post
    a "getRecharge" message accordingly*/
	myGame.on("recharge", function (evt) {
		//INSERT HERE YOUR RECHARGE SCRIPT THAT RETURN MONEY TO RECHARGE
		sendMessage({action:'getRecharge'});
	});


    /*and then we configure a few other imaginary events and their client
    app comms*/
	myGame.on("start_session", function (evt) {
		/*do whatever the game needs to do
        then send the message to the client app*/
		sendMessage({action: 'startSession'});
		/*more code here?*/
	});

	myGame.on("end_session", function (evt) {
		/*do whatever the game needs to do
        then send the message to the client app*/
		sendMessage({action: 'endSession'});
	});
	
	myGame.on("save_score", function (evt, iMoney) {
		/*do whatever the game needs to do
        then send the message to the client app*/
		sendMessage({action: 'saveScore', amount: iMoney-$_CURRENT_SCORE, total: iMoney});
		$_CURRENT_SCORE = iMoney;
	});
}

$(document).ready(function(){
    //listen for messages from the window.parent (client app)
	window.addEventListener("message",recieveMessage, false);

    //post the kickstarter message of getting the current user
	window.parent.postMessage({action:'getCurrentUser'},'*');
});


/*
in this example, everything kicks off posting a "getCurrentUser" message.
eventually it receives a "setCurrentUser" message with that info, and does
a similar process getting the game config, and so on, and so forth...
*/