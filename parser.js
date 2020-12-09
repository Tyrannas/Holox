var cache = {}

function hash(cursor, symbols) {
    if(Array.isArray(symbols)) {
        symbols = symbols.join(' ')
    }
    return "" + cursor + ":" + symbols
}

function saveToCache(cursor, node) {
    cache[hash(cursor, node.symbols)] = JSON.stringify(node)
}

function getFromCache(cursor, symbols) {
    return cache[hash(cursor, symbols)]
}


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

function parse(tokens, symbols, tree, grammar) {
    cache = {}
    return parseTokens(tokens, 0, symbols, tree, grammar)
}

function parseTokens(tokens, cursor, symbols, tree, grammar) {
    /**
     * @tokens: les tokens à parser
     * @cursor: la place du curseur dans tokens
     * @symbols: les symboles de règle que l'on cherche à évaluer
     * @tree: l'arbre auquel ajouter les nodes
     * @grammar: les règles de grammaire
     * 
     * Fonction récursive pour parser les tokens à partir d'une grammaire
     * 3 cas possibles de récursion: 
     * 1) on trouve une feuille -> fin de la branche de récursion
     * 2) on trouve un symbole non terminal -> on relance la récursion sur toutes les règles associées à ce symbole
     * 3) on a une liste de symboles -> on relance la récursion sur chacun de ces symboles
     */

     // si il n'y a plus de tokens a lire on termine
    if(cursor >= tokens.length) {
        return 0
    }

    if(USE_CACHE) {
        let inCache = getFromCache(cursor, symbols)
        if(inCache !== undefined) {
            let node = addChildrenFromCache(tree, inCache)
            return node.score
        }
    }

    var node = addChildren(tree, symbols)

    if (Array.isArray(symbols) && symbols.length === 1 ){
        symbols = symbols[0]
    }
    // condition d'arrêt, on a trouvé une feuille de l'arbre
    // on renvoie 1
    if (tokens[cursor].type == symbols){
        node.text.data = tokens[cursor].value
        // setValid(cursor, node)
        updateScore(node, 1)
        setValid(cursor, node)
        return 1
    }

    // sinon si il n'y qu'un seul symbole à traiter, mais qu'il n'est pas terminal
    if (!Array.isArray(symbols) && grammar[symbols] !== undefined) {
        var max = 0
        // on applique les différentes règles associées à ce symbole
        grammar[symbols].forEach(t => {
            // on récupère le score associé à chaque branche de règle
            var count = parseTokens(tokens, cursor, t, node, grammar)
            // on prend la branche avec la valeur la plus elevée
            // typiquement la branche la plus elevée sera celle qui aura validé le plus de feuilles
            if (count > max) {
                max = count
            }
        });
        // si on a un resultat on valide la branche
        if(max > 0) {
            resetNonMaxChildren(node)
            updateData(node)
            // setValid(cursor, node)
            updateScore(node, max)
            setValid(cursor, node)
            // console.log('reset non max:  ' + node.text.name)

        }
        // sinon on l'abandonne
        else {
            resetChildren(node)
        }
        return max
    }

    // 3e cas, on a un tableau de symboles
    if (Array.isArray(symbols)) {
        var total = 0
        // pour chacun des symboles on relance la récursion
        for(let symbol of symbols){
            if(terminals.includes(symbol) && !tokens.slice(cursor).map(e => e.type).includes(symbol)){
                // probablement inutile comme on a pas encore lancé la récursion
                resetChildren(node)
                return 0
            }
        }
        for (var i = 0; i < symbols.length; i++) {
            // on récupère le score de la branche, chaque fois qu'un terminal est matché on le consomme
            var count = parseTokens(tokens, total + cursor, symbols[i], node, grammar)
            // si la branche ne match pas de token on reset les children et on coupe la boucle + la branche
            if(count == 0) {
                resetChildren(node)
                return 0
            }
            // sinon on augmente le total du noeud avec les valeurs des sousbranches
            total += count
            updateScore(node, total)
        }
        updateData(node)
        // setValid(cursor, node)
        updateScore(node, total)
        setValid(cursor, node)
        return total
    }
    // si on a matché aucun des cas c'est que le token est un symbole terminal 
    resetChildren(node)
    return 0
    
}

function saveTree() {
    if(DEBUG){
        all_trees.push(JSON.stringify(simple_chart_config.nodeStructure))
    }
}

function updateScore(node, score) {
    if(node.score === score) {
        return
    }
    node.score = score
    node.text.name = node.text.name.split(':')[0] + ": " + score
    saveTree()
}

function addChildren(parent, name) {
    if (parent.children === undefined) {
        parent.children = []
    }
    if (Array.isArray(name)) {
        name = name.join(' ')
    }
    var child = {text:{"name": name + ': 0'}}
    child.symbols = name
    parent.children.push(child)
    saveTree()
    return child
}

function addChildrenFromCache(parent, nodeFromCache) {
    if (parent.children === undefined) {
        parent.children = []
    }
    let node = JSON.parse(nodeFromCache)
    parent.children.push(node)
    saveTree()
    return node
}

function setValid(cursor, node) {
    node.HTMLclass = "blue"
    if(USE_CACHE) {
        saveToCache(cursor, node)
    }
    saveTree()
}


function resetChildren(node) {
    if(Array.isArray(node.children)) {
        node.children.forEach(n => {
            if(n.HTMLclass !== undefined){
                resetChildren(n)
            }
        })
    }
    node.HTMLclass = undefined
    if(DELETE_USELESS){
        removeUselessBranches(node)
        saveTree()
    }
    updateScore(node, 0)
}

function resetNonMaxChildren(node) {
    if (node.children.length < 2) {
        return
    }
    let max = Math.max(...node.children.map(n => n.score))
    // console.log("max score: " + max)
    let index = node.children.map(n => n.score).indexOf(max)
    // console.log(node.children.length + ' : children. max score index: ' + index)
    for(let i = 0; i < node.children.length; i++) {
        if(i != index && node.children[i].score > 0) {
            resetChildren(node.children[i])
        }
    }
}

function setLeafGreen(node) {
    if(node.HTMLclass === undefined){
        return
    }    
    if(node.children !== undefined) {
        node.children.forEach(setLeafGreen)
    }
    else {
        node.HTMLclass = "green"
    }
}

function removeUselessBranches(node) {
    if(Array.isArray(node.children)) {
        node.children = node.children.filter(n => n.HTMLclass !== undefined)
        node.children.forEach(removeUselessBranches)
    }
}

function updateData(node) {
    if(node.children === undefined) return

    let data = node.children.filter(n => n.HTMLclass !== undefined).map(n => n.text.data).join('')
    node.text.data = data
}