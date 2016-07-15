var Monopoly = {};
Monopoly.allowRoll = true;
Monopoly.moneyAtStart = 300; //Changing the money users start with
Monopoly.doubleCounter = 0;

Monopoly.init = function(){
    $(document).ready(function(){
        Monopoly.adjustBoardSize();
        $(window).bind("resize",Monopoly.adjustBoardSize);
        Monopoly.initDice();
        Monopoly.initPopups();
        Monopoly.start();        
    });
};

Monopoly.start = function(){ //Makes the intro pop-up appears
    Monopoly.showPopup("intro")
};


Monopoly.initDice = function(){
    $(".dice").click(function(){ //When click on the dice, rolls the Dice if its your turn ad you can play
        if (Monopoly.allowRoll){
            Monopoly.rollDice();
        }
    });
};


Monopoly.getCurrentPlayer = function(){ //Get the player that is currently playing
    return $(".player.current-turn");
};

Monopoly.getPlayersCell = function(player){
    return player.closest(".cell");
};


Monopoly.getPlayersMoney = function(player){ //Get the current money of player
    return parseInt(player.attr("data-money"));
};

Monopoly.updatePlayersMoney = function(player,amount){ //Updating user player money
    var playersMoney = parseInt(player.attr("data-money")); //Turning the player money into a number
    playersMoney -= amount;
    if (playersMoney < 0 ){ //If the user has no more money
        alert("you are broke!")
    }
    player.attr("data-money",playersMoney); //updating the money of the player
    player.attr("title",player.attr("id") + ": $" + playersMoney); //updating the title with the player money (when the user hover the player).
    Monopoly.playSound("chaching"); //Playing a sound when the player is loosing or winning money
};


Monopoly.rollDice = function(){ //Randomizing every dice throw
    var result1 = Math.floor(Math.random() * 6) + 1 ; //Randomizing number 1
    var result2 = Math.floor(Math.random() * 6) + 1 ; //Randomizing number 2
    $(".dice").find(".dice-dot").css("opacity",0); //Setting every Dices to blank
    $(".dice#dice1").attr("data-num",result1).find(".dice-dot.num" + result1).css("opacity",1); //Finding Dice 1, updating its number to number 1 randomized and make it appears
    $(".dice#dice2").attr("data-num",result2).find(".dice-dot.num" + result2).css("opacity",1); //Finding Dice 2, updating its number to number 1 randomized and make it appears
    if (result1 == result2){ //If there is a double

        Monopoly.doubleCounter++; //update the counter (important to count for the jail rule)
    }
    var currentPlayer = Monopoly.getCurrentPlayer();
    Monopoly.handleAction(currentPlayer,"move",result1 + result2);
};


Monopoly.movePlayer = function(player,steps){ //TODO What is steps?
    Monopoly.allowRoll = false;
    var playerMovementInterval = setInterval(function(){
        if (steps == 0){
            clearInterval(playerMovementInterval);
            Monopoly.handleTurn(player);
        }else{
            var playerCell = Monopoly.getPlayersCell(player);
            var nextCell = Monopoly.getNextCell(playerCell);
            nextCell.find(".content").append(player);
            steps--;
        }
    },200);
};


Monopoly.handleTurn = function(){
    var player = Monopoly.getCurrentPlayer();
    var playerCell = Monopoly.getPlayersCell(player);
    if (playerCell.is(".available.property")){
        Monopoly.handleBuyProperty(player,playerCell);
    }else if(playerCell.is(".property:not(.available)") && !playerCell.hasClass(player.attr("id"))){
         Monopoly.handlePayRent(player,playerCell);
    }else if(playerCell.is(".go-to-jail")){
        Monopoly.handleGoToJail(player);
    }else if(playerCell.is(".chance")){
        Monopoly.handleChanceCard(player);
    }else if(playerCell.is(".community")){
        Monopoly.handleCommunityCard(player);
    }else{
        Monopoly.setNextPlayerTurn();
    }
}

Monopoly.setNextPlayerTurn = function(){
    var currentPlayerTurn = Monopoly.getCurrentPlayer();
    var playerId = parseInt(currentPlayerTurn.attr("id").replace("player",""));
    if ($("#dice1").attr("data-num") != $("#dice2").attr("data-num")){
        var nextPlayerId = playerId + 1;
        if (nextPlayerId > $(".player").length){ //setting again the Id to be player 1 and 2 TODO Verif
            nextPlayerId = 1;
        }
        currentPlayerTurn.removeClass("current-turn");
        var nextPlayer = $(".player#player" + nextPlayerId);
        nextPlayer.addClass("current-turn");
        if (nextPlayer.is(".jailed")){
            var currentJailTime = parseInt(nextPlayer.attr("data-jail-time"));
            currentJailTime++;
            nextPlayer.attr("data-jail-time",currentJailTime);
            if (currentJailTime > 3){ //If the player has already wait 3 turns in jail, let him play
                nextPlayer.removeClass("jailed");
                nextPlayer.removeAttr("data-jail-time");
            }
            Monopoly.setNextPlayerTurn();
            return;
        }
    }
    Monopoly.closePopup();
    Monopoly.allowRoll = true; //Allowing the next player to play
};


Monopoly.handleBuyProperty = function(player,propertyCell){
    var propertyCost = Monopoly.calculateProperyCost(propertyCell);
    var popup = Monopoly.getPopup("buy");
    popup.find(".cell-price").text(propertyCost); //get the price of the cell into the popup
    popup.find("button").unbind("click").bind("click",function(){ // Creating an event listener, erasing the link and creating a new one
        var clickedBtn = $(this);
        if (clickedBtn.is("#yes")){
            Monopoly.handleBuy(player,propertyCell,propertyCost); //if the user click yes,
        }else{
            Monopoly.closeAndNextTurn();
        }
    });
    Monopoly.showPopup("buy");
};

Monopoly.handlePayRent = function(player,propertyCell){
    var popup = Monopoly.getPopup("pay");
    var currentRent = parseInt(propertyCell.attr("data-rent"));
    var properyOwnerId = propertyCell.attr("data-owner");
    popup.find("#player-placeholder").text(properyOwnerId);
    popup.find("#amount-placeholder").text(currentRent);
    popup.find("button").unbind("click").bind("click",function(){
        var properyOwner = $(".player#"+ properyOwnerId);
        console.log(properyOwnerId)
        Monopoly.updatePlayersMoney(player,currentRent);
        Monopoly.updatePlayersMoney(properyOwner,-1*currentRent); // adding the current price to the owner of the property. minus is to make the currentRent an income
        Monopoly.closeAndNextTurn();
    });
   Monopoly.showPopup("pay");
};


Monopoly.handleGoToJail = function(player){
    var popup = Monopoly.getPopup("jail");
    popup.find("button").unbind("click").bind("click",function(){
        Monopoly.handleAction(player,"jail");
    });
    Monopoly.showPopup("jail");
};


Monopoly.handleChanceCard = function(player){
    var popup = Monopoly.getPopup("chance");
    popup.find(".popup-content").addClass("loading-state");
    $.get("https://itcmonopoly.appspot.com/get_random_chance_card", function(chanceJson){
        popup.find(".popup-content #text-placeholder").text(chanceJson["content"]);
        popup.find(".popup-title").text(chanceJson["title"]);
        popup.find(".popup-content").removeClass("loading-state");
        popup.find(".popup-content button").attr("data-action",chanceJson["action"]).attr("data-amount",chanceJson["amount"]);
    },"json");
    popup.find("button").unbind("click").bind("click",function(){
        var currentBtn = $(this);
        var action = currentBtn.attr("data-action");
        var amount = currentBtn.attr("data-amount");
        console.log("testing the action and amount " + action + " " + amount)
        Monopoly.handleAction(player,action,amount);
    });
    Monopoly.showPopup("chance");
};

Monopoly.handleCommunityCard = function(player){
    var popup = Monopoly.getPopup("community");
    popup.find(".popup-content").addClass("loading-state");
    $.get("https://itcmonopoly.appspot.com/get_random_community_card", function(chanceJson){
        popup.find(".popup-content #text-placeholder").text(chanceJson["content"]);
        popup.find(".popup-title").text(chanceJson["title"]);
        popup.find(".popup-content").removeClass("loading-state");
        popup.find(".popup-content button").attr("data-action",chanceJson["action"]).attr("data-amount",chanceJson["amount"]);
    },"json");
    popup.find("button").unbind("click").bind("click",function(){
        var currentBtn = $(this);
        var action = currentBtn.attr("data-action");
        var amount = currentBtn.attr("data-amount");
        console.log("testing the action and amount " + action + " " + amount)
        Monopoly.handleAction(player,action,amount);
    });
    Monopoly.showPopup("community");
    // //TODO: implement this method
    // alert("not implemented yet!")
    // Monopoly.setNextPlayerTurn();
};


Monopoly.sendToJail = function(player){
    player.addClass("jailed");
    player.attr("data-jail-time",1);
    $(".corner.game.cell.in-jail").append(player);
    Monopoly.playSound("woopwoop");
    Monopoly.setNextPlayerTurn();
    Monopoly.closePopup();
};


Monopoly.getPopup = function(popupId){ //Getting to popUp to appears according to the specific Id sent
    return $(".popup-lightbox .popup-page#" + popupId);
};

Monopoly.calculateProperyCost = function(propertyCell){ //
    var cellGroup = propertyCell.attr("data-group"); //Getting the group number of the cell the user is on
    var cellPrice = parseInt(cellGroup.replace("group","")) * 5; //Only selecting the number from the attribute and times 5.
    if (cellGroup == "rail"){
        cellPrice = 10;
    }
    return cellPrice;
};


Monopoly.calculateProperyRent = function(propertyCost){
    return propertyCost/2;
};


Monopoly.closeAndNextTurn = function(){
    Monopoly.setNextPlayerTurn();
    Monopoly.closePopup();
};

Monopoly.initPopups = function(){
    $(".popup-page#intro").find("button").click(function(){
        var numOfPlayers = $(this).closest(".popup-page").find("input").val();
        if (Monopoly.isValidInput("numofplayers",numOfPlayers)){
            Monopoly.createPlayers(numOfPlayers);
            Monopoly.closePopup();
        }
    });
};


Monopoly.handleBuy = function(player,propertyCell,propertyCost){
    var playersMoney = Monopoly.getPlayersMoney(player)
    if (playersMoney < propertyCost){
        Monopoly.showErrorMsg();
        Monopoly.playSound("evil");
    }else{
        Monopoly.updatePlayersMoney(player,propertyCost);
        var rent = Monopoly.calculateProperyRent(propertyCost);

        propertyCell.removeClass("available") //When the user can and buy the property, should no be available
                    .addClass(player.attr("id"))
                    .attr("data-owner",player.attr("id")) //Identifying that this property is owned
                    .attr("data-rent",rent);
        Monopoly.setNextPlayerTurn();
    }
};





Monopoly.handleAction = function(player,action,amount){
    console.log(action)
    switch(action){
        case "move":
       	    console.log(amount)
            Monopoly.movePlayer(player,amount); //Move the player to the amount of the dices
             break;
        case "pay":
            Monopoly.updatePlayersMoney(player,amount); //Updating the amount
            Monopoly.setNextPlayerTurn();
            break;
        case "jail":
            Monopoly.sendToJail(player);
            break;
    }
    Monopoly.closePopup();
};





Monopoly.createPlayers = function(numOfPlayers){
    var startCell = $(".go");
    for (var i=1; i<= numOfPlayers; i++){
        var player = $("<div />").addClass("player shadowed").attr("id","player" + i).attr("title","player" + i + ": $" + Monopoly.moneyAtStart);
        startCell.find(".content").append(player);
        if (i==1){
            player.addClass("current-turn");
        }
        player.attr("data-money",Monopoly.moneyAtStart);
    }
};


Monopoly.getNextCell = function(cell){
    var currentCellId = parseInt(cell.attr("id").replace("cell",""));
    var nextCellId = currentCellId + 1
    if (nextCellId > 40){
        console.log("YAY")
        Monopoly.handlePassedGo();
        nextCellId = 1;
    }
    return $(".cell#cell" + nextCellId);
};


Monopoly.handlePassedGo = function(){ //When one player passes the go, it gets 10% of the money it received at the beginning of the game
    var player = Monopoly.getCurrentPlayer();
    Monopoly.updatePlayersMoney(player,-Monopoly.moneyAtStart/10);
};


Monopoly.isValidInput = function(validate,value){
    var isValid = false;
    switch(validate){
        case "numofplayers":
            if(value > 1 && value <= 4){
                isValid = true;
            }
            //TODO: remove when done
            console.log("the val " + value);
            // isValid = true; //Cannot work if t you validate that it is true whatever
            break;

    }

    if (!isValid){
        Monopoly.showErrorMsg();
    }
    return isValid;

};

Monopoly.showErrorMsg = function(){
    $(".popup-page .invalid-error").fadeTo(500,1); //Make the error message appear 1/2second after pushing the button
    setTimeout(function(){ //make the message disappear after 2 seconds
            $(".popup-page .invalid-error").fadeTo(500,0);
    },2000);
};


Monopoly.adjustBoardSize = function(){
    var gameBoard = $(".board");
    var boardSize = Math.min($(window).height(),$(window).width());
    boardSize -= parseInt(gameBoard.css("margin-top")) *2;
    $(".board").css({"height":boardSize,"width":boardSize});
}

Monopoly.closePopup = function(){
    $(".popup-lightbox").fadeOut();
};

Monopoly.playSound = function(sound){
    var snd = new Audio("./sounds/" + sound + ".wav"); 
    snd.play();
}

Monopoly.showPopup = function(popupId){
    $(".popup-lightbox .popup-page").hide();
    $(".popup-lightbox .popup-page#" + popupId).show();
    $(".popup-lightbox").fadeIn();
};

Monopoly.init();