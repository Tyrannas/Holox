
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


function parseTokens(tokens, symbols, tree, grammar) {
    /**
     * @tokens: les tokens à parser
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

    // si il n'y a pas de tokens on termine
    if(tokens.length === 0) return 0

    var node = addChildren(tree, symbols)

    if (Array.isArray(symbols) && symbols.length === 1 ){
        symbols = symbols[0]
    }
    // condition d'arrêt, on a trouvé une feuille de l'arbre
    // on renvoie 1
    if (tokens[0] == symbols){
        console.log("on a trouvé un symbole terminal correspondant!! " + symbols)
        setValid(node)
        updateScore(node, 1)
        return 1
    }

    // sinon si il n'y qu'un seul symbole à traiter, mais qu'il n'est pas terminal
    if (!Array.isArray(symbols) && grammar[symbols] !== undefined) {
        var max = 0
        // on applique les différentes règles associées à ce symbole
        grammar[symbols].forEach(t => {
            // on récupère le score associé à chaque branche de règle
            var count = parseTokens(tokens, t, node, grammar)
            // on prend la branche avec la valeur la plus elevée
            // typiquement la branche la plus elevée sera celle qui aura validé le plus de feuilles
            if (count > max) {
                max = count
            }
        });
        // si on a un resultat on valide la branche
        if(max > 0) {
            setValid(node)
            updateScore(node, max)
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
        for (var i = 0; i < symbols.length; i++) {
            // on récupère le score de la branche, chaque fois qu'un terminal est matché on le consomme 
            var count = parseTokens(tokens.slice(total), symbols[i], node, grammar)
            // si la branche ne match pas de token on reset les children et on coupe la boucle + la branche
            if(count == 0) {
                resetChildren(node)
                return 0
            }
            // sinon on augmente le total du noeud avec les valeurs des sousbranches
            total += count
            updateScore(node, total)
        }
        console.log(symbols, total)
        setValid(node)
        updateScore(node, total)
        return total
    }
    // si on a matché aucun des cas c'est que le token est un symbole terminal 
    resetChildren(node)
    return 0
    
}

function saveTree() {
    all_trees.push(JSON.stringify(simple_chart_config.nodeStructure))
}

function updateScore(node, score) {
    var oldScore = Number(node.text.name.split(':')[1])
    if(oldScore === score) {
        return
    }
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
    parent.children.push(child)
    saveTree()
    return child
}

function setValid(node) {
    node.HTMLclass = "blue"
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
    updateScore(node, 0)
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
