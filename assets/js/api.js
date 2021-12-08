var player;
var Location = document.location.href.split('?')[0];

var ShikimoriLink = "https://shikimori.one/";
var AnimevostApiLink = "http://api.animevost.org/v1/";


function getPageType() {
    let search = getParameterByName('search');
    if (search != null) {
        return "search";
    }
    let id = getParameterByName('id');
    if (id != null) {
        return "title";     
    }
	let favorites = getParameterByName('favorites');
	if (favorites != null) {
        return "favorites";     
    }
	let year = getParameterByName('year');
	if (year != null) {
        return "year";     
    }
	let gen = getParameterByName('gen');
	if (gen != null) {
        return "gen";     
    }
    return "last";
}

function loadPage() {
	AnimevostApiMethod(
		"genres",
		loadDropdown,
		"POST",
		"",
		function(){
			document.getElementById("dropdown-genres").style.display = "none";
			document.getElementById("dropdown-years").style.display = "none";
			console.log("Ошибка получения жанров");
		}
	);
    let type = getPageType();
    if (type == "search") {
        AnimevostApiMethod(
			"search",
			unpackLastTitles,
			"POST",
			"name="+encodeURIComponent(getParameterByName('search')),
			function(){loadErrorPage("404");},
		);
        return
    }
    if (type == "title") {
        AnimevostApiMethod(
			"info",
			unpackOneTitle,
			"POST",
			"id="+encodeURIComponent(getParameterByName("id")),
		);
        return
    }
	if (type == "favorites") {
		loadFavorites();
        return
    }
	if (type == "gen") {
		AnimevostApiMethod(
			"search",
			loadYearOrGenre,
			"POST",
			"gen="+getParameterByName('gen'),
			function(req){
				if (req.status == 0) {
					loadErrorPage("Нет данных");
				} else {
					loadErrorPage("Ошибка api");
				}
			}
		)
		return
	}
	if (type == "year") {
		AnimevostApiMethod(
			"search",
			loadYearOrGenre,
			"POST",
			"year="+getParameterByName('year'),
			function(req){
				if (req.status == 0) {
					loadErrorPage("Нет данных");
				} else {
					loadErrorPage("Ошибка api");
				}
			}
		)
        return
    }
	var page = getParameterByName('page');
	AnimevostApiMethod(
		"last?page="+(page!=null ? page : 1)+"&quantity=20",
		unpackLastTitles,
		"GET",
	);
}
function loadDropdown(data) {
	var dropdown_genres = document.getElementById("dropdown-menu-genres");
	var dropdown_years = document.getElementById("dropdown-menu-years");
	var genres = new Array();
	var years = new Array();
	for (var key in data){
		if (data[key]!="Жанр"){
			if (!isNaN(data[key])){
				years.push(parseInt(data[key]));
			} else {
				genres.push(data[key]);
			}
		}
	}
	years.sort((a,b)=> b-a);
	years.forEach(function(elem){
		var year = document.createElement("a");
		year.className = "dropdown-item";
		year.innerHTML = elem;
		year.href = Location+"?year="+elem;
		dropdown_years.appendChild(year);
	});
	genres.forEach(function(elem){
		var genre = document.createElement("a");
		genre.className = "dropdown-item";
		genre.innerHTML = elem;
		genre.href = Location+"?gen="+elem;
		dropdown_genres.appendChild(genre);
	});
}
function loadYearOrGenre(year){
	var sliced_data = slice_array(year.data, 20);
	var page = getParameterByName('page');
	unpackLastTitles({
		state: {
			count: year.data.length,
			status: "ok"
		},
		data: sliced_data[page==null? 0: parseInt(page)-1]
	});
}
function loadFavorites(){
	var data = localStorage.getItem('data');
//	console.log(data);
	if (data!="" && data!=null){
		var output = [];
		data = data.split('|');
		for (var i = 0; i < data.length; i++){
			if (data[i]!=""){
				output.push(JSON.parse(data[i]));
				}
		}
		var out_data = {
			state: {
				count: output.length,
				status: "ok"
			},
			data: output.reverse(),
		};
		unpackLastTitles(out_data);
	} else {
		var container = document.getElementById("container");
		container.style = "width:100%;height:100%;display:flex;align-items:center;justify-content: center;";
		var message = document.createElement("div");
		message.className = "message";
		var p = document.createElement("p");
		p.innerHTML = "Тут появлятся аниме после того как вы добавите их в избранное кнопкой";
		message.appendChild(p);
		container.appendChild(message);
		
	}
}

function loadErrorPage(msg) {
	var container = document.getElementById("container");
	while (container.firstChild) {
    	container.removeChild(container.firstChild);
	}
	container.style = "width:100%;height:100%;display:flex;align-items:center;justify-content: center;";
	document.title = msg;
	var h1 = document.createElement("h1");
	h1.innerHTML = msg;
	container.appendChild(h1);
}
function GetAnimesMethodByArg(
		 arg,
		 onload,
		 method="",
		 onerror=null,
	){
	var url = `${ShikimoriLink}api/animes/${arg}/${method}`;
	var req = new XMLHttpRequest();
	req.open("GET", url, true);
    req.onload = function(){onload(req.response)};
	req.onerror = (
		onerror!=null ?
		onerror : function() {console.log(`GET запрос ${url} завершился неудачей`)}
	);
    req.send();
}
function AnimevostApiMethod(
		method,
		onload,
		type,
		args="",
		onerror=null,
	){
	var req = new XMLHttpRequest();
	var url =  `${AnimevostApiLink}${method}`;
	req.open(type, url, true);
	req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	req.onload = function(){
		if (req.response != null) {
			var resp = JSON.parse(req.response);
			try {
				if (resp['state']['status']=='ok'){
					onload(resp);
				} else {
					loadErrorPage("404");
				}
			} catch {
				
				onload(resp);
			}
	}
		
	};
	req.onerror = (
		!(onerror!=null) ?
		function() {
			console.log(`${type} запрос ${url} завершился неудачей`);
			loadErrorPage("Ошибка api");
		} : function(){onerror(req)}
	);
	if (type=="POST"){req.send(args)}
	else {req.send()}
	
}


function loadShikimori(resp){
	if(resp == null || resp.length == 2){
		return
	}
	var data = JSON.parse(resp);
//	console.log(data);
	var blocks = document.getElementsByClassName("blocks")[0];
	var block = document.createElement("div");
	var block_a = document.createElement("a");
	block_a.href=ShikimoriLink+data['url'];
	block.className = "block link";
		var name = document.createElement("div");
		name.className = "name";
		name.innerHTML = "Shikimori";
		block_a.appendChild(name);	
		var score = data['score'];
		var value = document.createElement("div");
		value.className = "value";
		value.innerHTML = score;
		block_a.appendChild(value);
		var value2 = document.createElement("div");
		value2.className = "value";
		value2.style.fontSize = "70%";
		var text_score = JSON.parse('{"0":"нет данных","1":"Хуже некуда","2":"Ужасно","3":"Очень плохо","4":"Плохо","5":"Более-менее","6":"Нормально","7":"Хорошо","8":"Отлично","9":"Великолепно","10":"Эпик вин!"}');
		value2.innerHTML = text_score[parseInt(score,10)];
		block_a.appendChild(value2);
	block.appendChild(block_a);
	blocks.appendChild(block);
	var req = new XMLHttpRequest();
	req.open("GET", ShikimoriLink+"api/animes/"+data['id']+'/roles', true);
	req.onload = function() {
		var characters_data = req.response;
		if (characters_data != null) {
			var characters_data = JSON.parse(characters_data);
			var box = document.getElementById("shikimori-block");
			var characters = document.createElement("div");
			characters.className = "characters row";
			var roles = [];
			for (var i = 0; i < characters_data.length; i++) {
				if (characters_data[i]['roles'].includes('Main')){
					roles.push(characters_data[i]['character']);
				}
			}
			if (roles.length>0){
				var h2 = document.createElement("h2");
				h2.innerHTML = "Главные герои";
				box.appendChild(h2);
				for (var i = 0; i < roles.length; i++){
					var character = document.createElement("a");
					character.href = ShikimoriLink+roles[i]['url'];
					character.className = "col-lg-2 col-md-3 col-sm-4 col-5 character m-1 m-sm-2 p-0";
						var img = document.createElement("div");
						img.style.backgroundImage = "url("+ShikimoriLink+roles[i]['image']['original'] +")";
						character.appendChild(img);
						img.className = "pic";
						var p = document.createElement("p");
						p.innerHTML = roles[i]['russian'];
						character.appendChild(p);
					characters.appendChild(character);
				}
				box.appendChild(characters);
				
			}
			GetAnimesMethodByArg(
				data['id'],
				loadScreenshots,
				"screenshots"
			);
		}
	};
	req.onerror = function() {console.log("Ошибка загрузки информации о персонажах.");};
	req.send();
	
	
}

function loadScreenshots(resp){
	if(resp == null || resp.length == 2){
		return
	}
	var data = JSON.parse(resp);
	SetStylesheet('assets/css/fancybox.css');
	SetScript('assets/js/fancybox.umd.js')
	var box = document.getElementById("shikimori-block");
	var h2 = document.createElement("h2");
	var gallery = document.createElement("div");
	gallery.className = "gallery fbox3";
	h2.innerHTML = "Скриншоты";
	box.appendChild(h2);
	var checkbox = document.createElement("input");
	checkbox.id = "gallery-checkbox"
	checkbox.type = "checkbox";
	checkbox.className = "toggle-box";
	var label = document.createElement("label");
	label.setAttribute("for","gallery-checkbox");
	box.appendChild(checkbox);
	box.appendChild(label);
	for (var i = 0; i < data.length; i++) {
		var image_a = document.createElement("a");
		image_a.setAttribute("data-fancybox","gallery");
		image_a.href = ShikimoriLink+data[i]['original'];
		var image = document.createElement("div");
		image.className = "image";
		var img = document.createElement("img");
		img.className = "img-fluid";
		img.src = ShikimoriLink+data[i]['original'];
		image_a.appendChild(img);
		image.appendChild(image_a);
		gallery.appendChild(image);
	}
	box.appendChild(gallery);
	
}

function loadFranchise(resp){
	
}
function setupPlayer(playlist) {
	var mask = document.getElementsByClassName("video-mask")[0];
    var player = new Playerjs({
		id:"web-player",
		file: playlist,
		fluid: true,
		autoplay: false,
		preferFullWindow: true,
	});
}
function SaveToFavorites(){
	let id = encodeURIComponent(getParameterByName("id"));
	let data = localStorage.getItem('data');
	var button = document.getElementById("favorite");
	if (button.style.filter == ""){
		button.style.filter = "invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)";
	} else {
		button.style.filter = "";
	}
	this_elem = JSON.stringify({
				urlImagePreview: document.getElementsByClassName('preview')[0].src,
				id: parseInt(id),
				title: document.getElementsByClassName('title')[0].innerHTML,
			});
	if (data == "" || data == null) {
		localStorage.setItem('data', this_elem);
		return;
	} else {
		alldata = data.split('|');
//		console.log(data);
		var ids = [];
		for (i=0; i<alldata.length; i++) {
			data = JSON.parse(alldata[i]);
			ids.push(parseInt(data.id));
		}
		var index = ids.indexOf(parseInt(id));
		if (index != -1){
			alldata.splice(index, 1);
		} else {
			alldata.push(this_elem);
		}
		localStorage.setItem('data', alldata.join('|'));
	}
}
function unpackOneTitle(resp){
	var newTitle = resp.data[0];
//	console.log(newTitle);
	SetStylesheet('assets/css/watch.css');
	var container = document.getElementById('container');
	container.className = "container";
		var title = document.createElement("h1");
		var ru_title = titleName(newTitle['title']);
		title.className = "title";
		if (document.title!=ru_title){
			document.title = ru_title;
		}
		title.innerHTML = ru_title;
		container.appendChild(title);
		var box = document.createElement("div");
		box.className = "box";
		var div_ = document.createElement("div");
			var img = document.createElement("img");
			img.src = newTitle['urlImagePreview'];
			img.className = "preview";
			div_.appendChild(img);
			div_.className = "first-box";
			var info_box = document.createElement("div");
			info_box.className = "info-box";
				var text_box = document.createElement("div");
				text_box.className = "text-box";
					var elems = [
						["Год",newTitle['year']],
						["Эпизодов",seriesFromTitle(newTitle['title'])],
						["Режиссер", newTitle['director']],
						["Жанры", newTitle['genre']],
					];
					var blocks = document.createElement("div");
					blocks.className = "blocks";
						for (var i = 0; i < elems.length; i++) {
							if (elems[i][1]!= ""){
								var div = document.createElement("div");
								div.className = "block";
									var name = document.createElement("div");
									name.className = "name";
									name.innerHTML = elems[i][0];
									div.appendChild(name);
									var value = document.createElement("div");
									value.className = "value";
									value.innerHTML = elems[i][1];
									div.appendChild(value);
								blocks.appendChild(div);
							}
						}
					var timer = document.createElement("div");
					timer.className = "block";
					var name = document.createElement("div");
					name.className = "name";
					if (newTitle['timer']!==0){
						name.innerHTML = 'До выхода новой серии осталось';
						timer.appendChild(name);
						var value = document.createElement("div");
						value.className = "value";
						value.innerHTML = '0:00:00:00';
						value.id = "timer";
						timer.appendChild(value);
						var req = new XMLHttpRequest();
						var elem = document.getElementById("seasons-block");
						req.open("GET", "https://semolikavplayerapi.herokuapp.com/api/time", true);
						req.setRequestHeader("Content-Type", "application/json");
						req.onload = function() {
							if (req.status==200){
								var left = parseInt(newTitle['timer'] - req.response);
								insertAfter(blocks.getElementsByClassName('block')[elems.length-1], timer);
								setInterval(function() {
									var foo = new Date;
									left = left - 1;
									if (left > 0){
										minutes = left / 60 | 0,
										hours = minutes / 60 | 0,
										days = hours / 24 | 0,
										hours = hours % 24;
										if (hours < 10){hours = "0"+hours};
										seconds = left%60;
										if (seconds < 10){seconds = "0"+seconds};
										minutes %= 60;
										if (minutes < 10){minutes = "0"+minutes};
										dd = " дней ";
										tid = "";
										if (days == 1){dd = " день "};
										if (days < 5 && days > 1){dd = " дня "};
										if (days > 0){tid = days + dd};
										value.innerHTML = days + ":" + hours +":"+ minutes +":"+ seconds ;
									}
								}, 1000);
							} else {
								throw "";
							}
						}
						req.onerror = function(){console.log("Ошибка получения времени сервера")}
						req.send()
					} else {
						name.innerHTML = 'Данный релиз входит в раздел "нестабильных". Серии выходят по мере возможности.';
						timer.appendChild(name);
					}
					div_.appendChild(blocks);
						var favorite_div = document.createElement("div");
						favorite_div.className = "icon-box";
							var favorite = document.createElement("object");
							favorite.setAttribute("data", "assets/images/heart.svg");
							let id = encodeURIComponent(getParameterByName("id"));
							var data = localStorage.getItem('data');
							if (data!='' && data!=null){
								data.split('|').forEach(function(element){
									if (JSON.parse(element).id == parseInt(encodeURIComponent(getParameterByName("id")))){
										favorite.style.filter = "invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)";	
									}
								});
							}
							favorite.setAttribute("type", "image/svg+xml");
							favorite.id = "favorite";
							favorite.className = "icon";
							favorite_div.appendChild(favorite);
						favorite_div.setAttribute("onclick", "SaveToFavorites()");
					div_.appendChild(favorite_div);
					box.appendChild(div_);
					var label = document.createElement('h3');
					label.className = "label";
					label.innerHTML = "Описание";
					text_box.appendChild(label);
					var p = document.createElement('p');
					p.innerHTML = newTitle['description'];
					text_box.appendChild(p);
					var video_mask = document.createElement("div");
					video_mask.className = "video-mask";
						var video = document.createElement("div");
						video.id = "web-player";
						video_mask.appendChild(video);
					AnimevostApiMethod(
						"playlist",
						function(data) {setupPlayer(rebuildPlaylist(data))},
						"POST",
						"id=" +newTitle['id'],
					);
				info_box.appendChild(text_box);
			box.appendChild(info_box);
			box.appendChild(video_mask);
			var shikimori = document.createElement("div");
			shikimori.id = "shikimori-block";
			box.appendChild(shikimori);
	
			var seasons = document.createElement("div");
			seasons.id = "seasons-block";
			seasons.className = "seasons";
			var loader = document.createElement("div");
			loader.className = "loader";
			seasons.appendChild(loader);
			box.appendChild(seasons);
		container.appendChild(box);
		loadSeasons(newTitle['title'], id);
		GetAnimesMethodByArg(
			"?search="+titleOriginalName(newTitle['title'])+" "+titleName(newTitle['title']),
			function(resp) {
				if(resp.length == 2){return}
				GetAnimesMethodByArg(
					JSON.parse(resp)[0]['id'],
					loadShikimori
				);
			}
		);
}
function loadSeasons(name, id){
	var req = new XMLHttpRequest();
	var elem = document.getElementById("seasons-block");
	req.open("POST", "https://semolikavplayerapi.herokuapp.com/api/search", true);
	req.setRequestHeader("Content-Type", "application/json");
	req.onload = function(){
		
		if (req.status==200){
			var resp = JSON.parse(req.response);
			var block_title = document.createElement("h2");
			block_title.innerHTML = "Это аниме состоит из";
			var blocks_container = document.createElement("div");
			var blocks = document.createElement("div");
			blocks.className = "blocks";
			for(var key in resp.links){
				var div = document.createElement("a");
				div.href = Location+"?id="+ resp.links[key].id;
				div.className = "block link";
					var name = document.createElement("div");
					name.className = "name";
					name.innerHTML = resp.links[key].name;
					div.appendChild(name);
				blocks.appendChild(div);
			}
			elem.removeChild(elem.firstChild);
			elem.appendChild(block_title);
			elem.appendChild(blocks);
		} else {
			elem.removeChild(elem.firstChild);
		}
	}
	req.onerror = function(){console.log("Ошибка загрузки сезонов")}
	req.send(JSON.stringify({"name":name,"id": id}))
}
function SetStylesheet(path){
	var newSS=document.createElement('link');
	newSS.rel='stylesheet';
	newSS.href=path;
	document.getElementsByTagName("head")[0].appendChild(newSS);
}
function SetScript(path){
	var newSS=document.createElement('script');
	newSS.src=path;
	document.body.appendChild(newSS);
}
function unpackLastTitles(newTitles) {
//	console.log(newTitles);
   	var lastTitles = [];
	var page = getParameterByName('page');
	for (i=0; i<newTitles.data.length; i++) {
		lastTitles.push(newTitles.data[i]);
	}
	var pages = (lastTitles.length>20? parseInt(lastTitles.length/ 20, 10) : parseInt((newTitles['state']['count']/ 20), 10))+1;
	page = (page!=null?(Number.isInteger(parseInt(page)) && (1<=page && page<=pages) ? page-1 : 0):0)+1;
	if (lastTitles.length>20){
		lastTitles = slice_array(lastTitles,20);
		lastTitles = lastTitles[page-1];
	} 
	SetStylesheet('assets/css/index.css');
	var container = document.getElementById('container');
	container.className = "center w-100";
	var cards = [];
	for (var i = 0; i < lastTitles.length; i++) {
		var lastTitle = lastTitles[i];
		var card_div = document.createElement("div");
		card_div.className = "w-xxl-20 col-xl-3 col-lg-4 col-md-4 col-sm-6 col-15 p-3 m-0 center";
		var card = document.createElement("a");
		card.className = "card";
		card.href = Location+"?id="+lastTitle['id'];
			var img = document.createElement("img");
			img.src = lastTitle['urlImagePreview'];
			card.appendChild(img);
			var title = document.createElement("p");
			title.className = "name";
			title.innerHTML = lastTitle['title'];
			card.appendChild(title);
		card_div.appendChild(card);
		cards.push(card_div);
	}
	var sliced_cards = cards;
	var row = document.createElement("div");
	row.className = "row center w-100 px-2";
	for (var i = 0; i < sliced_cards.length; i++) {
		row.appendChild(sliced_cards[i]);
	}
	container.appendChild(row);
	var body = document.body;
	var search = getParameterByName('search');
	search = (search!==null&&search!=="null" ? "&search="+search : "");
	var year = getParameterByName('year');
	if (year!=null){
		search+="&year="+year;
	}
	var gen = getParameterByName('gen');
	if (gen!=null){
		search+="&gen="+gen;
	}
	if (pages!=1){
		var nav = document.createElement('nav');
			var ul = document.createElement('ul');
			ul.className = "pagination";
				var first = document.createElement('li');
				first.className = "page-item"+(page==1?" disabled":"");
				var first_a = document.createElement('a');
				first_a.className = "page-link";
				first_a.innerHTML = "1";
				first_a.tabIndex = -1;
				first_a.href  = Location+"?page=1" + search;
				first.appendChild(first_a);
				ul.appendChild(first);

				var range = (window.outerWidth<=470?2 : (window.outerWidth<=590? 3 : 4))+2;
				for (var i = (page-range>0 ? page-range: 1)+1; i < (page>=range ? (page+range+1>pages ? pages : page+range) : (page+range>pages? pages : page+range)); i++){
					var li = document.createElement('li');
					var a = document.createElement('a');
						a.className = "page-link";
						a.innerHTML = i;
						a.href = "?page="+i + search;
						li.appendChild(a);
						li.className = "page-item";
					if (i==page){
						li.className = "page-item disabled";
					}
					ul.appendChild(li);
				}
				var last = document.createElement('li');
				last.className = "page-item"+(page==pages?" disabled":"");
				var last_a = document.createElement('a');
				last_a.className = "page-link";
				last_a.innerHTML = pages;
				last_a.href  = Location+"?page="+pages + search;
				last.appendChild(last_a);
				ul.appendChild(last);
				nav.appendChild(ul);
			body.appendChild(nav);
	}
}

function slice_array(array,size) {
	let subarray = [];
	for (let i = 0; i <Math.ceil(array.length/size); i++){
		subarray[i] = array.slice((i*size), (i*size) + size);
	}
	return subarray;
};


function titleName(name) {
    let first = name.split(" /");
    return first[0]
}

function titleOriginalName(name) {
    let first = name.split(" /");
    let second = first[1].split(" [");
    return second[0]
}

function seriesFromTitle(name) {
    let first = name.split(" /");
    let second = first[1].split(" [");
    return second[1].substring(0, second[1].length - 1)
}

function insertAfter(referenceNode, newNode) {
	referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function rebuildPlaylist(old) {
    var res = new Array();
    old.sort(resort)
    for (i=0; i<old.length; i++) {
        res.push({title: old[i]["name"],
				  poster: old[i]["preview"],
				  file: "[SD]" + old[i]["std"] + ",[HD]" + old[i]["hd"]});
    };
    return res
}


function resort(item1, item2) {
	var num1 =parseInt(item1["name"].match(/\d+/));
	var num2 =parseInt(item2["name"].match(/\d+/));
    return parseInt(num1) - parseInt(num2)
}


function getParameterByName(name, url) {
	const queryString = window.location.search;
	const urlParams = new URLSearchParams(queryString);
	return urlParams.get(name);
}