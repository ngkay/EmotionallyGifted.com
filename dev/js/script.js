var selfie = {};

selfie.init = function(){
	selfie.getSelfie();
	selfie.another();
	$('.new-playlist').smoothScroll();
};

$(function(){
	selfie.init();
});

selfie.apiKey = '4c01718c64034bdb88a04f8f46709c3e';
selfie.apiUrl = 'https://api.projectoxford.ai/emotion/v1.0/recognize';

//user uploads or takes photo. function gets the photo
selfie.getSelfie = function(){
	var takePicture = document.querySelector("#take-selfie");
	takePicture.onchange = function(event){
		$('.photo-preview').empty();
		// Get a reference to the taken picture or chosen file
		var files = event.target.files,
			file;
		if (files && files.length > 0) {
			file = files[0];
		}
		// console.log(file);

		//takes photo from user and runs thru emotion api
		selfie.getEmotionData(file);

		//takes photo from user and runs function to show on page
		selfie.showSelfie(file);
	};
};

//function that takes photo from user and runs thru emotion api
selfie.getEmotionData = function(file){
	$.ajax({
		url: selfie.apiUrl,
		beforeSend: function(xhrObj){
			xhrObj.setRequestHeader('Content-Type', 'application/octet-stream');
			xhrObj.setRequestHeader('Ocp-Apim-Subscription-Key', selfie.apiKey);
		},
		type: 'POST',
		data: file, //file is var/param from getSelfie();
		processData: false
	}).done(function(response){
		//response is object containing detected faces that show position and emotion scores
		console.log(response);

		//uses response to show where faces are on photo
		selfie.getFaceBox(response);

		//uses response to create array of emotions of faces in photo
		selfie.getEmotion(response);
	});
};

//function that takes photo from user and displays on page
selfie.showSelfie = function(file){
	var emptyPreview = $('<img>').attr('id', 'preview');
	$('.photo-preview').append(emptyPreview);
	var preview = document.querySelector('#preview');
	selfie.selfieUrl = window.URL.createObjectURL(file);
	preview.src = selfie.selfieUrl;
	$('.main-left').css('opacity', 1);
	$('#preview').fadeIn(800).css('display', 'block');
	$('.loading').fadeIn(0);
	$('.loading h2').fadeIn(800);
	$('.loading-animation').fadeIn(800);

	$('#file-button').text('Give me another selfie!')
	$('.site-description').slideUp(800);

	selfie.getNaturalDimensions(selfie.selfieUrl);
};

//function to get percentage difference between dimensions of user input image and image displayed
selfie.getNaturalDimensions = function(imgURL){
	var image = new Image();
	image.src = imgURL;
	image.onload = function(){
		selfie.nWidth = this.naturalWidth;
		selfie.nHeight = this.naturalHeight;
	};
};

//function to show faces on photo with box around
selfie.getFaceBox = function(faceObject){
	//for loop to go thru faces detected in photo (up to 64 faces)
	for (var i = 0; i < faceObject.length; i++){
		//stores faceRetangle with position,height,width
		var faceRectangle = faceObject[i]['faceRectangle'];
		// console.log(faceRectangle);

		selfie.faceboxResponsive(faceRectangle);

		//adds px to end of values in faceRectangle
		for(var key in faceRectangle){
			faceRectangle[key] = faceRectangle[key] + '%';
		}
		// console.log(faceRectangle);
		//creates empty div for the face, prepends into .photo-preview
		var faceRectangleDiv = $('<div>').addClass('faceRectangle', 'faceRectangle' + i).css(faceRectangle)
		$('.photo-preview').prepend(faceRectangleDiv);
	}
};

selfie.faceboxResponsive = function(faceRectangle){
	faceRectangle.width = faceRectangle.width / selfie.nWidth * 100;
	faceRectangle.height = faceRectangle.height / selfie.nHeight * 100;
	faceRectangle.left = faceRectangle.left / selfie.nWidth * 100;
	faceRectangle.top = faceRectangle.top / selfie.nHeight * 100;
	// console.log(faceRectangle);
}

//function to find highest displayed emotion in each face
selfie.getEmotion = function(faceObject){
	//new array of emotions
	selfie.emotions = [];
	//for loop to go thru array and sort emotions
	for (var i = 0; i < faceObject.length; i++){
		//store emotions scores from API in object
		var emotionScores = faceObject[i]['scores'];
		// console.log(emotionScores);
		//turn emotionScores into array emotionSort so can sort scores low to high
		var emotionSort = [];
		for (var emotion in emotionScores){
			emotionSort.push([emotion, emotionScores[emotion]]);
			emotionSort.sort(function(a, b) {return a[1] - b[1]});
		}
		// console.log(emotionSort);
		//emotion stores last array in emotionSort. last one is highest scoring emotion
		var emotion = _.last(emotionSort);
		// console.log(emotion);
		//push emotion into array of emotions for face[i]
		selfie.emotions.push(emotion[0]);
	}
	console.log(selfie.emotions);
	if (selfie.emotions.length > 1){
		selfie.averageEmotions(selfie.emotions);
	} else {
		selfie.finalEmotion = selfie.emotions[0];
		// console.log(selfie.finalEmotion);
		selfie.emotionSpotifyQuery(selfie.finalEmotion);
		selfie.emotionGiphyQuery(selfie.finalEmotion);
		selfie.emotionToDisplay(selfie.finalEmotion);
	}
};

//function that runs if more than 1 face, therefore more than 1 emotion, is detected. finds the most frequent emotion to use as query for song/playlist
selfie.averageEmotions = function(emotionsArray){
	var maxEmotionFrequency = 1;
	var counter = 0;
	for (var i = 0; i < emotionsArray.length; i++){
		for (var j = i; j < emotionsArray.length; j++){
			if (emotionsArray[i] === emotionsArray[j]){
				counter++;
			}
			if (maxEmotionFrequency < counter){
				maxEmotionFrequency = counter;
				selfie.finalEmotion = emotionsArray[i];
			}
		}
		counter = 0;
	}
	// console.log(selfie.finalEmotion);
	selfie.emotionSpotifyQuery(selfie.finalEmotion);
	selfie.emotionGiphyQuery(selfie.finalEmotion);
	selfie.emotionToDisplay(selfie.finalEmotion);
};

//function to take finalEmotion and turn it into usable query word
selfie.emotionSpotifyQuery = function(emotion){
	if (emotion === 'anger'){
		selfie.spotifyQueryString = 'angry';
	} else if (emotion === 'contempt'){
		selfie.spotifyQueryString = 'boost OR lift';
	} else if (emotion === 'disgust'){
		selfie.spotifyQueryString = 'boost OR lift';
	} else if (emotion === 'fear'){
		selfie.spotifyQueryString = 'cheer OR boost';
	} else if (emotion === 'happiness'){
		selfie.spotifyQueryString = 'happy OR party';
	} else if (emotion === 'neutral'){
		selfie.spotifyQueryString = 'chill OR easy';
	} else if (emotion === 'sadness'){
		selfie.spotifyQueryString = 'sad OR feels';
	} else if (emotion === 'surprise'){
		selfie.spotifyQueryString = 'surprise OR smile';
	}
	// console.log(selfie.finalEmotion);
	// selfie.getSpotify(emotionQueryString);
	// console.log(emotionQueryString);
};

//emotion turned into more appropriate query on Giphy
selfie.emotionGiphyQuery = function(emotion){
	if (emotion === 'anger'){
		selfie.giphyQueryString = 'angry';
	} else if (emotion === 'contempt'){
		selfie.giphyQueryString = 'contempt';
	} else if (emotion === 'disgust'){
		selfie.giphyQueryString = 'disgust';
	} else if (emotion === 'fear'){
		selfie.giphyQueryString = 'scared';
	} else if (emotion === 'happiness'){
		selfie.giphyQueryString = 'happy';
	} else if (emotion === 'neutral'){
		selfie.giphyQueryString = 'meh';
	} else if (emotion === 'sadness'){
		selfie.giphyQueryString = 'sad';
	} else if (emotion === 'surprise'){
		selfie.giphyQueryString = 'surprise';
	}
	// console.log(selfie.finalEmotion);
	selfie.getGiphy(selfie.giphyQueryString, function(){
		selfie.getSpotify(selfie.spotifyQueryString, function(){});
	});
	// console.log(emotionQueryString);
};

selfie.emotionToDisplay = function(emotion){
	if (emotion === 'anger'){
		selfie.displayEmotion = 'angry';
		selfie.displayDescription = 'Hey buddy it\'s ok, people get angry all the time but why don\'t we take that anger and turn it into something positive?';
	} else if (emotion === 'contempt'){
		selfie.displayEmotion = 'contempt';
		selfie.displayDescription = 'I get it you\'re feeling a bit of disrespect right now, let\'s get a bit of a boost with some sick music.';
	} else if (emotion === 'disgust'){
		selfie.displayEmotion = 'disgusted';
		selfie.displayDescription = 'That. Was. Absolutely. Disgusting. Time to change the topic and boost the mood.';
	} else if (emotion === 'fear'){
		selfie.displayEmotion = 'scared';
		selfie.displayDescription = 'Sometimes life get\'s a little scary but everything you want is on the other side of fear. Let\'s get to the other side.';
	} else if (emotion === 'happiness'){
		selfie.displayEmotion = 'happy';
		selfie.displayDescription = 'SO happy. Everything is awesome. Let\'s get this party started.';
	} else if (emotion === 'neutral'){
		selfie.displayEmotion = 'neutral';
		selfie.displayDescription = 'Cool.';
	} else if (emotion === 'sadness'){
		selfie.displayEmotion = 'sad';
		selfie.displayDescription = 'When you\'re happy you enjoy the music. When you\'re sad you understand the lyrics.';
	} else if (emotion === 'surprise'){
		selfie.displayEmotion = 'surprised';
		selfie.displayDescription = 'WTF was that?!';
	}
	console.log(selfie.displayEmotion);
};

//get data from spotify
selfie.getSpotify = function(emotion, callback){
	$.ajax({
		url: 'https://api.spotify.com/v1/search',
		method: 'GET',
		dataType: 'json',
		data: {
			q: emotion,
			type: 'playlist',
			limit: 50
		}
	}).then(function(res){
		// console.log(res);
		selfie.playlists = res.playlists.items;
		selfie.randomPlaylist(selfie.playlists.length);
		callback();
	});
};

selfie.randomNumGenerator = function(length){
	selfie.initRandomNum = 100;
	selfie.randomNum = Math.floor(Math.random() * length);
	while (selfie.randomNum === selfie.initRandomNum){
		selfie.randomNum = Math.floor(Math.random() * length);
	}
	selfie.initRandomNum = selfie.randomNum;

	console.log(selfie.randomNum);
};

//gets 1 random playlist and displays it
selfie.randomPlaylist = function(playlistLength){
	selfie.randomNumGenerator(playlistLength);
	selfie.finalPlaylist = selfie.playlists[selfie.randomNum];
	console.log(selfie.finalPlaylist);

	selfie.playlistHTML = '<iframe id="spotify" src="https://embed.spotify.com/?uri=' + selfie.finalPlaylist.uri + '&theme=white" width="100%" height="300" frameborder="0" allowtransparency="true"></iframe>';

	selfie.output();
};

//gets data from Giphy based on emotionquery
selfie.getGiphy = function(emotion, callback){
	$.ajax({
		url: 'http://api.giphy.com/v1/gifs/search',
		method: 'GET',
		// dataType: 'json',
		data: {
			api_key: 'dc6zaTOxFJmzC',
			q: emotion,
			limit: 50
		}
	}).then(function(res){
		// console.log(res);
		selfie.giphys = res.data;
		// console.log(selfie.giphys);
		selfie.randomGiphy(selfie.giphys.length);
		callback();
	});
};

//get random Giphy from data
selfie.randomGiphy = function(giphysLength){
	selfie.randomNumGenerator(giphysLength);
	selfie.finalGiphy = selfie.giphys[selfie.randomNum];
	console.log(selfie.finalGiphy);

	selfie.giphyHTML = '<img src="' + selfie.finalGiphy.images.original.url + '"/>';
	selfie.giphyTweetUrl = selfie.finalGiphy.bitly_gif_url;
	console.log(selfie.giphyTweetUrl);

	// selfie.output();
};

selfie.tweet = function(){
	$('.tweet-button').empty();
	var tweetBtn = $('<a></a>')
		.addClass('twitter-share-button')
		.attr('href', 'http://twitter.com/share')
		.attr('data-url', 'http://www.emotionallygifted.com')
		.attr('data-text', 'Mood: ' + selfie.giphyTweetUrl + ". Get your mood at:")
		.attr('data-hashtags', 'emotionallygifted', 'mood, ' + selfie.displayEmotion)
		.attr('data-size', 'large');
	$('.tweet-button').append(tweetBtn);
	twttr.widgets.load();
	console.log(tweetBtn);
	$('.tweet').html('<h3>Mood: ' + selfie.giphyTweetUrl + ". Get yours at: EmotionallyGifted.com #emotionallygifted #mood #" + selfie.finalEmotion + "</h3>");
};

//function to fadeout 'loading' div
selfie.output = function(){
	// var spotifyNote = $('<p>')
	$('.feeling').html('Feeling ' + selfie.displayEmotion + '?');
	$('.description-text').empty().append('<h3>' + selfie.displayDescription + '</h3>');
	$('.spotify-embed').empty().append(selfie.playlistHTML);
	$('.description-gif').empty().append(selfie.giphyHTML);
	selfie.tweet();
	$('.loading').delay(800).fadeOut(800);
};

//get another playlist
selfie.another = function(){
	$('.new-playlist').on('click', function(e){
		// $('html, body').animate({
		// 	scrollTop: $('#main').offset().top
		// }, 800);
		e.preventDefault();
		$('.loading').fadeIn(0);
		selfie.randomGiphy(selfie.giphys.length);
		selfie.randomPlaylist(selfie.playlists.length);
	});
};