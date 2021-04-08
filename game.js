var cvs = $('#cvs');
var ctx = document.getElementById('cvs').getContext('2d');

var drawHangman = function(x = 0, y = 0, w = 100, calc = false, wtd = null){
    let hd = w * (7 / 13);
    let l = hd * (3 / 2);
    let dy = Math.sqrt(l ** 2 - (w / 2) ** 2);
    let h = hd + l + dy;

    if(calc) return h;
    if(wtd === null) return;

    ctx.lineWidth = w * (3 / 25);

    if(wtd >= 0 && wtd < 1) ctx.strokeRect(x + (w - hd) / 2, y, hd, hd);

    ctx.beginPath();

    if(wtd >= 1 && wtd < 2){
        ctx.moveTo(x + w / 2, y + hd);
        ctx.lineTo(x + w / 2, y + hd + l);
    }

    if(wtd >= 2 && wtd < 3){
        ctx.moveTo(x + w / 2, y + hd + (l + w / 10) / 2);
        ctx.lineTo(x + w / 10, y + hd + w / 5);
    }

    if(wtd >= 3 && wtd < 4){
        ctx.moveTo(x + w / 2, y + hd + (l + w /10) / 2);
        ctx.lineTo(x + (w - w / 10), y + hd + w / 5);
    }

    if(wtd >= 4 && wtd < 5){
        ctx.moveTo(x + w / 2, y + hd + l);
        ctx.lineTo(x, y + hd + l + dy);
    }

    if(wtd >= 5 && wtd < 6){
        ctx.moveTo(x + w / 2, y + hd + l);
        ctx.lineTo(x + w, y + hd + l + dy);
    }

    ctx.stroke();
}

var draw = function(w, wtd){
    let h = drawHangman(null, null, w, true);

    let x = (cvs.width() - w) / 2;
    let y = (cvs.height() - h) / 2;

    drawHangman(x, y, w, false, wtd);
}

var drawByOrder = (ms = 500, n = 6, t = 1) => {
    let tl = 1;
    let ims = 0;
    let intervalId = setInterval(function(){
        for(let i = 0; i < n; ++i){
            setTimeout(() => draw(34, i), ims + i * ms);
        }
        if(tl++ >= t) return clearInterval(intervalId);
        ims += n * ms;
        setTimeout(() => ctx.clearRect(0, 0, cvs.width(), cvs.height()), ims);
    }, ms);
}

var Interact = function(elements){
    let {input : i, proceed : p, cancel : c} = elements;

    let wait = (el, boo) => new Promise(resolve => el.addEventListener('click', () => resolve(boo)));

    this.init = text => {
        i.value = '';
        i.setAttribute('placeholder', text);
    }

    this.confirm = (text = i.value) => {
        this.init(text);
        return Promise.any([wait(c, false), wait(p, true)]).then();
    }

    this.prompt = (text = i.value) => {
        this.init(text);
        return Promise.any([wait(c, () => null), wait(p, () => i.value)]).then(f => f());
    }
}

/*(() => {
    let n = 1;
    while(confirm(`Here's the alert #${n++}`));
    confirm('Cancelled');
})();*/

/*(async () => {
    let n = 1;
    while(await i.confirm(`Here's the alert #${n++}`));
    await i.confirm('Cancelled');
})();*/

var getWords = async set => {
    set = await fetch('./words.json').then(response => response.json()).then(data => data[set])
    return set;
}

var game = async () => {
    ctx.clearRect(0, 0, cvs.width(), cvs.height());

    let i = new Interact({
        input : document.getElementById('text'),
        proceed : document.getElementById('proceed'),
        cancel : document.getElementById('cancel')
    });

    let words = await getWords('programming');

    let pickWord = () => words[Math.floor(Math.random() * words.length)];
    let setupAnswerArray = word => '?'.repeat(word.length).split('');

    let mistakes = 0;
    let guessed = [];

    let showPlayerProgress = answerArray => {
        let div = document.getElementById('show-guessed')
        answerArray = answerArray.map(char => char.toUpperCase());
        answerArray = answerArray.map(char => (char === '?') ? `<p class="not-guessed">${char}</p>` : `<p class="guessed">${char}</p>`);
        div.innerHTML = answerArray.join(' ');
    };

    let getGuess = async () => {
        let guess = await i.prompt('Please guess a letter');
        return typeof guess !== 'string' || guess.length !== 1 ? false : guess.toLowerCase();
    }

    let updateGameState = (guess, word, answerArray) => {
        let numberOfGuesses = 0;
        for (let n = 0; n < word.length; ++n) {
            if (word[n] === guess) {
                answerArray[n] = guess;
                ++numberOfGuesses;
            }
        }
        return numberOfGuesses;
    };

    let congratulate = async word => {
        showPlayerProgress(word.split(''));
        return await i.confirm(`Thanks for playing!`);
    }

    /* hangman coding */

    let word = pickWord();
    let answerArray = setupAnswerArray(word);
    let remainingLetters = word.length;

    while(remainingLetters > 0 && mistakes < 6){
        showPlayerProgress(answerArray);
        let guess = await getGuess().then();
        if(guess === null){
            break;
        }else if(!guess || guessed.includes(guess)){
            continue;
        }else{
            let correctGuesses = updateGameState(guess, word, answerArray);
            if(correctGuesses === 0) draw(34, mistakes++);
            remainingLetters -= correctGuesses;
            guessed.push(guess);
        }
    }
    while(!await congratulate(word));
    game();
};

game();