
function buildGrammar(grammarRules) {
    grammar = {}
    rules = grammarRules.split(';')
    rules.pop()
    rules.forEach(r => { 
        let parsed = r.split(':=')
        let tokens = parsed[1].split('|').map(tok => tok.trim().split(' '))
        grammar[parsed[0].trim()] = tokens
    })
    return grammar
}


function parseTokens(tokens, symbol, tree, grammar) {
    var node = addChildren(tree, symbol)
    all_trees.push(JSON.stringify(simple_chart_config.nodeStructure))
    if (Array.isArray(symbol) && symbol.length === 1 ){
        symbol = symbol[0]
    }
    if (Array.isArray(symbol)) {
        var total = 0
        for (var i = 0; i < symbol.length; i++) {
            var count = parseTokens(tokens.slice(total), symbol[i], node, grammar)
            if(count == 0) {
                resetChildren(node)
                return 0
            }
            total += count
        }
        if(total > 0) {
            setValid(node)
        }
        return total
    }

    if (tokens[0] == symbol){
        console.log("on a trouvé un symbole terminal correspondant!! " + symbol)
        setValid(node)
        return 1
    }
    if (grammar[symbol] !== undefined) {
        var max = 0
        grammar[symbol].forEach(t => {
            var count = parseTokens(tokens, t, node, grammar)
            if (count > max) {
                max = count
            }
        });
        if(max > 0) {
            setValid(node)
        }
        else {
            resetChildren(node)
        }
        return max
    }
    resetChildren(node)
    return 0
    
}


function addChildren(parent, name) {
    if (parent.children === undefined) {
        parent.children = []
    }
    if (Array.isArray(name)) {
        name = name.join(' ')
    }
    var child = {text:{"name": name}}
    parent.children.push(child)
    return child
}

function setValid(node) {
    node.HTMLclass = "blue"
}

function resetChildren(node) {
    if (node.children === undefined) return
    node.children.forEach(n => {
        n.HTMLclass = undefined
    })
}

function setLeafGreen(node) {
    if(node.HTMLclass === undefined){
        console.log("zut!")
        return
    }    
    if(node.children !== undefined) {
        node.children.forEach(setLeafGreen)
    }
    else {
        node.HTMLclass = "green"
    }
}
