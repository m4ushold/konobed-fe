function addSubject(string) {
    const s= document.getElementById('recommended-subjects')
        
    const tmp = document.createElement('div')
    tmp.classList.add('subject')
    tmp.textContent = string
    s.appendChild(tmp)   
}

function filter(){

    var searchWord, name, item, i;

    searchWord = document.getElementById("search-word").value.toUpperCase();
    item = document.getElementsByClassName("subject");
    console.log(searchWord)

    for(i=0;i<item.length;i++){
        name = item[i];
        if(name.innerHTML.toUpperCase().indexOf(searchWord) > -1){
            item[i].style.display = "flex";
        }else{
            item[i].style.display = "none";
        }
    }
}


function test() {
    let subjectList = ['example', 'subject', 'making', 'is', 'hard']
    for(let s of subjectList) addSubject(s);
}

test()