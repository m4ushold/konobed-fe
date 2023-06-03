function colorGenerator() {
    return '#'+Math.ceil(Math.random()*255).toString(16) + Math.ceil(Math.random()*255).toString(16) + Math.ceil(Math.random()*255).toString(16)
}

function onCheckboxClicked(e) {
    let checkbox = e.target
    
    let color = colorGenerator()
    
    if (checkbox.style.fill == '' || checkbox.style.fill == 'white') checkbox.style.fill = color
    else checkbox.style.fill = 'white'
}

function addNews() {

    let checkbox = document.createElement('div')

    checkbox.classList.add('check-box')
    checkbox.onclick = (e) => onCheckboxClicked(e)
    checkbox.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><g id="Shape / Square"><path id="Vector" d="M3 6.2002V17.8002C3 18.9203 3 19.4796 3.21799 19.9074C3.40973 20.2837 3.71547 20.5905 4.0918 20.7822C4.5192 21 5.07899 21 6.19691 21H17.8031C18.921 21 19.48 21 19.9074 20.7822C20.2837 20.5905 20.5905 20.2837 20.7822 19.9074C21 19.48 21 18.921 21 17.8031V6.19691C21 5.07899 21 4.5192 20.7822 4.0918C20.5905 3.71547 20.2837 3.40973 19.9074 3.21799C19.4796 3 18.9203 3 17.8002 3H6.2002C5.08009 3 4.51962 3 4.0918 3.21799C3.71547 3.40973 3.40973 3.71547 3.21799 4.0918C3 4.51962 3 5.08009 3 6.2002Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g></svg>'

    let news = document.createElement('div')
    news.classList.add('news')

    let newsCard = document.createElement('div')
    newsCard.classList.add('news-card')

    let newsTitle = document.createElement('div')
    newsTitle.classList.add('news-title')
    newsTitle.textContent = 'news Title'

    let newsContent = document.createElement('div')
    newsContent.classList.add('news-content')
    newsContent.textContent = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'

    news.appendChild(newsTitle)
    news.appendChild(newsContent)

    newsCard.appendChild(checkbox)
    newsCard.append(news)

    document.getElementById('news-container').appendChild(newsCard)
}

function addResultCnt(x) {
    let resultCnt = document.createElement('div')
    resultCnt.classList.add('result-cnt')
    resultCnt.textContent = `${x} results`

    document.getElementById('news-container').appendChild(resultCnt)
}

function test() {
    addResultCnt(10);
    for (let i =0;i<10;i++) addNews(i);
}


function normalize(pos) {
    let norm = Math.sqrt(pos[0]*pos[0] + pos[1]*pos[1] + pos[2]*pos[2])
    return [pos[0]/norm, pos[1]/norm, pos[2]/norm]
}


test()