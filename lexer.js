function scan(tokenizer, inputStream){
    // transform an inputStream in a tokenStream using a tokenize
    let tokens = []
    for(cursor = 0; cursor < inputStream.length; ++cursor){
        // ignore spaces
        if(inputStream[cursor] === " "){
            continue
        }
        let found = false
        for (let el of Object.entries(tokenizer)){
            let regex = el[1]
            let tokenName = el[0]
            let res = inputStream.slice(cursor).match(regex)
            if(res){
                console.log("wow we found a " + tokenName + " with value " + res)
                tokens.push({type: tokenName, value: res[0]})
                found = true
                cursor += res[0].length - 1
                break
            }
        }
        if(!found){
            console.log("arf, could not tokenize character " + inputStream[cursor])
        }
    }
    return tokens
}

function buildTokenizer(lexerRules){
    // take an input in the form:
    // tokenName := regExp ;
    tokenizer = {}
    lexems = lexerRules.split(';')
    if(lexems[lexems.length - 1] === '') lexems.pop()
    lexems.forEach(l => { 
        let parsed = l.split(':=')
        regex = "^" + parsed[1].trim()
        tokenizer[parsed[0].trim()] = new RegExp(regex)
    })
    return tokenizer
}