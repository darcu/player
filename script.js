/*
- flexbox lists
- slide in lists

- user playlists
- artist view
- remove from list
- shuffle
/- repeat/repeat one
/- volume control
- position slider
- resume on refresh
- persistemt shit / playlist
- drag and drop
- color themes
- use splice to update lists

bugz:
- move up/down
- click on butt selects

buttons:
- &#9658 - cross


*/

$(document).ready(function() {
	/* cookies */
	// function setCookie(c_name, value, exdays) {
	// 	var exdate = new Date();
	// 	exdate.setDate(exdate.getDate() + exdays);
	// 	var c_value = escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
	// 	document.cookie=c_name + "=" + c_value;
	// }

	// function getCookie(c_name) {
	// 	var c_value = document.cookie;
	// 	var c_start = c_value.indexOf(" " + c_name + "=");
	// 	if (c_start == -1) {
	// 		c_start = c_value.indexOf(c_name + "=");
	// 	}
	// 	if (c_start == -1) {
	// 		c_value = null;
	// 	}
	// 	else {
	// 		c_start = c_value.indexOf("=", c_start) + 1;
	// 		var c_end = c_value.indexOf(";", c_start);
	// 		if (c_end == -1) {
	// 			c_end = c_value.length;
	// 		}
	// 		c_value = unescape(c_value.substring(c_start,c_end));
	// 	}
	// 	return c_value;
	// }

	// var username=getCookie("sc_lm2");
	// if (username!=null && username!="") {
	// 	console.log(username);
	// }

	/* soundcloud init */
	SC.initialize({
		client_id: 'd38e1193271880ed4a4571398d56d589',
		client_secret: 'a7185a452c47434d8023fe41c018fa5b',
		redirect_uri: 'http://darcu.net/wip/soundcloudapi/',
		// access_token: username,
		access_token: '1-36306-882870-ec5630d18edc67175',
        scope: 'non-expiring'
	});

	// soundcloud auth
	if(SC.isConnected()) 
		SC.get('/me', function(me) { $('#nowplaying').after('<input type="button" class="statusbar ctrl login" id="userLogoff" value="' + me.username + '">'); });
	else 
		// $('#nowplaying').after('<input type="button" class="statusbar ctrl login" id="userLogin" value="login">');

	SC.whenStreamingReady(function() {
		console.log('soundReady')
	});

	// $('#userLogin').click(function() {
	// 	SC.connect(function() {
	// 		SC.get('/me', function(me) {
	// 			$('#nowplaying').after('<input type="button" class="statusbar" id="userLogoff" value="' + me.username + '">');
	// 			/* lasa-ma */	// setCookie("sc_lm2", SC.accessToken(), 365); // cookie persistence
	// 		});
	// 	});
	// });

	/* vars */
	var searchlist;
	var playlist = [];
	var selectedIndex;

	var currentTrack; // SoundManager2 object for current track
	var currentPlaylist;
	var currentPlaylistTrack; // currently playing track, index
	var interval; //current time interval
	var repeat = 0;

	var paused = false;


	/* functions */
	setInterval( function(){ UI.currentTimePos();}, 1000 );

	function pushToList(list, track, index) {
		// console.log('push ' );

		if(arguments.length < 3 || index >= list.length)
			insertToList(list, track, list.length);
		else {
			// console.log('pula');
			list.push(list[list.length]);
			for( i = list.length - 1; i > index; i--){
				insertToList(list, track, i)
			}
			insertToList(list, track, index);
		}
	}

	function insertToList(list, track, index) {
		console.log('insert ' + track.title + ' ' + index);

		list[index] = track;	
		
		// ui stuff
		UI.insertToList(list, track, index);
	}

	function removeFromList(list, index) {
		console.log('rem ' + list + ' ' + index);
		for( i = list.length - 1; i >= index; i--){
			insertToList(list, list[i], i-1);
		}
		list[list.length] = null;

		UI.removeFromList(list, list.length);
	}

	function search() {
		var query = $('#searchterm').val();
		var track;
		searchlist = [];

		SC.get('/tracks', { q: query }, function(tracks) {
			$('.searchlist li').remove();
			for (var i = 0; i < tracks.length; i++){
				if(tracks[i].streamable){
					pushToList(searchlist, tracks[i]);
				}
			}
		});		
	};

	function playSelectedTrack() {
		playTrack(pickList($('.selected').parent()), selectedIndex);
	}

	function playPrevTrack() {
		if(currentPlaylistTrack === 0) {
			if(repeat === 1) {
				currentPlaylistTrack = currentPlaylist.length;
				playTrack(currentPlaylist, currentPlaylistTrack);
			}
		}
		else if(repeat === 2) 
			playTrack(currentPlaylist, currentPlaylistTrack);
		else
			playTrack(currentPlaylist, --currentPlaylistTrack);

		// updateUI();
		UI.nowplaying();
		UI.currentTimePos();
	}

	function playNextTrack() {
		// console.log(currentPlaylistTrack);
		if(currentPlaylist === currentPlaylist.length) {
			if(repeat === 1) {
				currentPlaylistTrack = 0;
				playTrack(currentPlaylist, currentPlaylistTrack);
			}
		}
		else if(repeat === 2)
			playTrack(currentPlaylist, currentPlaylistTrack);
		else
			playTrack(currentPlaylist, ++currentPlaylistTrack);

		// console.log(currentPlaylistTrack + ' end');
		// updateUI();
		UI.nowplaying();
		UI.currentTimePos();
	}

	function playTrack(list, track) {
		//play stuff
		currentPlaylistTrack = track;
		currentPlaylist = list;

		if(currentPlaylist[currentPlaylistTrack].id){
			SC.stream("/tracks/" + currentPlaylist[currentPlaylistTrack].id, {
				onload: function() {
					console.log("onload");
				},
				onfinish: function() { 
					console.log("finish");
					playNextTrack();
				},
				onplay: function() {
					console.log("onplay");
				}},
				function(sound){
					if(currentTrack != undefined)
						currentTrack.stop();
					currentTrack = sound;
					currentTrack.play(); 

					currentTrack.setVolume($(".volume").val());

					// console.log('sound ' + currentTrack);
					// console.log('state sound ' + sound._onStateChange());

					for (var key in currentTrack) {
					    console.log('k ' + key);
					}

					UI.activate();
					UI.buttonPress();
					UI.nowplaying();
					UI.currentTimePos('reset');
				}
			);
		}
	}

	function togglePause() {
		if(currentTrack) {
			//play stuff
			currentTrack.togglePause();
			paused = !paused;
			// if(currentTrack._state === "playing")
			// 	currentTrack.pause();
			// else if(currentTrack._state === "paused")
			// 	currentTrack.resume();

			// updateUI();
			UI.buttonPress();
			UI.currentTimePos();
		}
	}

	function setVolume() {
		if(currentTrack){
			console.log('old ' + currentTrack.volume);
	    	currentTrack.setVolume($(".volume").val());
	    	console.log('new ' + currentTrack.volume);
	    }
	}

	// upDateUI;
	var UI = {};

	UI.insertToList = function(list, track, index) {
		console.log('ins ' + pickListClass(list) + ' ' + $(pickListClass(list) + ' li') + ' ' + index + ' ' + track.title);
		
		if($(pickListClass(list) + ' li').length)
			$(pickListClass(list) + ' li').eq(index-1).after('<li class="playlistitem" id="tr'+index+'">' + track.title + '<span class="listuser">' + track.user.username + '</span><a href="#" id="playbutton" class="listbutton">►</a>' + (pickListClass(list) === '.searchlist' ? '<a href="#" id="addbutton" class="listbutton">★</a>':'<a href="#" id="moveup" class="listbutton">▲</a><a href="#" id="movedown" class="listbutton">▼</a><a href="#" id="remove" class="listbutton">&#9473;</a></li>'));		
		else
			$(pickListClass(list)).append('<li class="playlistitem" id="tr'+index+'">' + track.title + '<span class="listuser">' + track.user.username + '</span><a href="#" id="playbutton" class="listbutton">►</a>' + (pickListClass(list) === '.searchlist' ? '<a href="#" id="addbutton" class="listbutton">★</a>':'<a href="#" id="moveup" class="listbutton">▲</a><a href="#" id="movedown" class="listbutton">▼</a><a href="#" id="remove" class="listbutton">&#9473;</a></li>'));					
	}

	UI.removeFromList = function(list, index) {
		$(pickListClass(list) + ' li').eq(index).remove();
	}

	UI.buttonPress = function() {
		switch(repeat) {
			case 0: 
				$('#repeat').toggleClass("active", false);
				$("#repeat").prop("value", "\u2941");
				break;
			case 1: 
				$('#repeat').toggleClass("active", true);
				break;
			case 2:
				// $('#repeat').toggleClass("active", true);
				$("#repeat").prop("value", "\u2941 1");
				break;
		}

		if(currentTrack) {
			if(paused)
			// if(currentTrack.paused)
			// if(currentTrack._state === 'paused')
				$("#play").prop("value", "play");
			else
				$("#play").prop("value", "pause");
		}
	}

	UI.activate = function() {
		$('.list li').removeClass("active");
		$(pickListClass(currentPlaylist) + ' li').eq(currentPlaylistTrack).addClass("active");
	}

	UI.select = function(listOrlistSelector, index) {
		//ui stuff
		// listClass = pickListClass(listOrlistSelector);

		$('.selected').removeClass("selected");
		$(pickListClass(listOrlistSelector) + ' li').eq(index).addClass("selected");

		var o  = $('.selected').offset().top;
		var h = $(window).height();
		var t  = $(window).scrollTop();
		// console.log( 'off ' + o + ' top ' + t + ' t-o ' + (t - o) + ' h ' + h);
		if( h - o + t <= 14)
			$(window).scrollTop(t + 28);
		if( t - o >= -80 )
			$(window).scrollTop(t - 28);

		//internal stuff
		selectedIndex = $('.selected').prevAll('li').length;
	};

	UI.nowplaying = function(){
		if(currentPlaylist[currentPlaylistTrack])
				$("#nowplaying").html("<span>" + currentPlaylist[currentPlaylistTrack].title + "</span>");
			else
				$("#nowplaying").html("<span>StoPPed</span>");
	};
		
	UI.currentTimePos = function(reset) {
		if(reset = 'reset')
			$("#currenttime").html( '00:00 / 00:00');
		if(currentTrack){
			if(currentTrack.position != undefined && currentTrack.durationEstimate != undefined) {
				$("#currenttime").html( toMinutes(currentTrack.position) + " / " + toMinutes(currentTrack.durationEstimate) );
				// $("#currenttime").html( toMinutes(currentTrack._currentPosition) + " / " + toMinutes(currentTrack._duration) );
				$(".seek").prop("value", 100/currentTrack.durationEstimate * currentTrack.position);
				// $("progress").prop("value", 100/currentTrack._duration * currentTrack._currentPosition);
			}
		}
	}

	function toMinutes(time) {
		var sec = Math.floor(time/1000)%60, min = Math.floor(time/1000/60);
		return (min < 10 ? "0" + min:min) + ":" + (sec < 10 ? "0" + sec:sec);
	}

	function pickList (obj) {
		if(obj.hasClass("searchlist"))
			return searchlist;
		else if(obj.hasClass("playlist"))
			return playlist;
		else
			console.log("you have no class " + obj.attr('class'));
	}

	function pickListClass (nameOrListOrObj) { //accepts playlist arrays or DOM objects
		// if(typeOf)
		// console.log('type ' + Object.prototype.toString.call( nameOrListOrObj ));
		if (typeof nameOrListOrObj === 'string') {
			// console.log('pickListClass return string ' + nameOrListOrObj)
			return nameOrListOrObj;
		}
		else if (Object.prototype.toString.call( nameOrListOrObj ) === '[object Array]') {
			// console.log('pickListClass return array ' + nameOrListOrObj)
			if(nameOrListOrObj === searchlist) 
				return ".searchlist";
			else if(nameOrListOrObj === playlist)	
				return ".playlist";	
			else
				console.log("you have no class name " +  nameOrListOrObj[0]);
		}
		else {
			// console.log('pickListClass return array ' + nameOrListOrObj)
			if(nameOrListOrObj.hasClass("searchlist"))
				return ".searchlist";
			else if(nameOrListOrObj.hasClass("playlist"))
				return ".playlist";
			else
				console.log("you have no class name " +  nameOrListOrObj.attr('class'));
		}
	}

	/* event handlers */
	//Enter works on search button
	$('#play').on('click', function() {
		//play stuff
		togglePause();
	});

	$('#prev').on('click', function() {
		//play stuff
		playPrevTrack();
	});

	$('#next').on('click', function() {
		//play stuff
		playNextTrack();
	});

	$('#repeat').on('click', function() {
		//ctrl stuff
		repeat = (repeat+1)%3;
		// console.log('repeat ' + repeat);
		//ui stuff
		// updateUI();
		UI.buttonPress();
		// UI.currentTimePos();
	});

	$('.volume').on('change', function(e) {
		setVolume();
	});

	$('.seek').on('click', function(e) {
		if(currentTrack) {
		   	//play stuff
			var parentOffset = $(this).parent().offset(); 
		    var relX = e.pageX - parentOffset.left;
		    var w = $(this).width();
		    var s = (relX/w)*currentTrack.durationEstimate;
		    currentTrack.setPosition(s);
		    //UI stuff
		   	UI.currentTimePos();
		}
		// console.log('relX ' + relX + ' w ' + w + ' calc ' + (relX/w) + ' duration ' + currentTrack.durationEstimate);
	});

	$('#searchbutton').click(search);
	$('#searchterm').keydown( function(event) {
       if(event.keyCode == 13){
           search();
       }
   });

	$(document).keydown( function(event) {
		console.log(event.keyCode);
		if(event.keyCode == 38) {
			event.preventDefault();			
			if(selectedIndex - 1 >= 0) {
				UI.select($('.selected').parent(), selectedIndex - 1);
			}
		}
		if(event.keyCode == 40) {
			event.preventDefault();
			if($('.selected'))
				if(selectedIndex + 1 < $('.searchlist li').length) { ///!!!fix searchlist index
					UI.select($('.selected').parent(), selectedIndex + 1);
				}
		}
		if(event.keyCode == 13) {
			event.preventDefault();
			if($('.selected'))
				playSelectedTrack();
		}
	});

	//playlist item click
	$('.list').on('click', 'li', function() {
		//ui stuff
		// console.log('onclick');
		UI.select($(this).parent(), $(this).prevAll('li').length);
	});

	$('.list').on('dblclick', 'li', function() {
		//play stuff
		// playTrack(pickList($(this).parent()), $(this).prevAll('li').length);
		playSelectedTrack();
	});

	$('.list').on('click', '#playbutton', function(){
		//play stuff
		playSelectedTrack();
	});

	$('.list').on('click', '#addbutton', function(){
		//play stuff
		// console.log("$(this).parent().prevAll('li').length " + $(this).parent().prevAll('li').length);
		pushToList(playlist, searchlist[$(this).parent().prevAll('li').length]);

		//$('.selected').prevAll('li').length;
	});

	$('.list').on('click', '#moveup', function(){
		var sel = $('.selected');
		if(sel.prevAll('li').length - 1 >= 0) {
			var indx = sel.prevAll('li').length;

			var list = pickList(sel.parent());
			var tmpList = list[indx-1];
			list[indx-1] = list[indx];
			list[indx] = tmpList;

			UI.select(sel.parent(), indx - 1);
		}
	});

	$('.list').on('click', '#remove', function(){
		removeFromList($(this).parent(), $(this).parent().prevAll('li').length);
	});

	$(document).on('mouseleave', function () {
		// console.log('out')
		$('.selected').toggleClass('out', true)
	});	

	$(document).on('mouseenter', function () {
		// console.log('in')
		$('.selected').toggleClass('out', false)
	});



	// auto search
	search();

});