class GrammarParser {
    constructor(grammar) {
        this.clear()
        this.grammar = grammar

        this.USE_CACHE = true
    }
    clear() {
        this.tree = new ParserTree()
        this.cache = {}
    }
    getTree() {
        return this.tree
    }
    parse(inputTokens, symbols) {
        this.clear()
        return this.recursiveParse(inputTokens, 0, symbols, this.tree.getRootNode())
    }
    recursiveParse(tokens, cursor, symbols, parentNode) {
        /**
        * @tokens: les tokens à parser
        * @cursor: la place du curseur dans tokens
        * @symbols: les symboles de règle que l'on cherche à évaluer
        * @parentNode: reference vers le noeud parent
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

        if(this.USE_CACHE) {
            let inCache = this.getFromCache(cursor, symbols)
            if(inCache !== undefined) {
                let node = this.addChildrenFromCache(parentNode, inCache)
                return node.score
            }
        }

        var node = this.addChildren(parentNode, symbols)

        if (Array.isArray(symbols) && symbols.length === 1 ){
            symbols = symbols[0]
        }
        // condition d'arrêt, on a trouvé une feuille de l'arbre
        // on renvoie 1
        if (tokens[cursor].type == symbols) {
            // on sauve le texte qui correspond au token dans data
            node.data = tokens[cursor].value
            this.updateScore(node, 1)
            this.saveSolution(cursor, node)
            return 1
        }

        // sinon si il n'y qu'un seul symbole à traiter, mais qu'il n'est pas terminal
        if (!Array.isArray(symbols) && this.grammar[symbols] !== undefined) {
            var max = 0
            // on applique les différentes règles associées à ce symbole
            this.grammar[symbols].forEach(symbol => {
                // on récupère le score associé à chaque branche de règle
                var count = this.recursiveParse(tokens, cursor, symbol, node)
                // on prend la branche avec la valeur la plus elevée
                // typiquement la branche la plus elevée sera celle qui aura validé le plus de feuilles

                if (count > max) {
                    max = count
                }
            });
            // si on a un resultat on valide la branche
            if(max > 0) {
                this.keepBestSolution(node)
                this.updateData(node)
                this.updateScore(node, max)
                this.saveSolution(cursor, node)
                // console.log('reset non max:  ' + node.text.name)

            }
            // sinon on l'abandonne
            else {
                this.resetChildren(node)
            }
            return max
        }

        // 3e cas, on a un tableau de symboles
        if (Array.isArray(symbols)) {
            var total = 0

            for (var i = 0; i < symbols.length; i++) {
                // on récupère le score de la branche, chaque fois qu'un terminal est matché on le consomme
                var count = this.recursiveParse(tokens, total + cursor, symbols[i], node)
                // si la branche ne match pas de token on reset les children et on coupe la boucle + la branche
                if(count == 0) {
                    this.resetChildren(node)
                    return 0
                }
                // sinon on augmente le total du noeud avec les valeurs des sousbranches
                total += count
            }
            this.updateData(node)
            this.updateScore(node, total)
            this.saveSolution(cursor, node)
            return total
        }
        // si on a matché aucun des cas c'est que le token est un symbole terminal 
        return 0
        
    }
    hash(cursor, symbols) {
        if(Array.isArray(symbols)) {
            symbols = symbols.join(' ')
        }
        return "" + cursor + ":" + symbols
    }
    saveToCache(cursor, node) {
        this.cache[this.hash(cursor, node.symbols)] = node
    }
    getFromCache(cursor, symbols) {
        return this.cache[this.hash(cursor, symbols)]
    }
    addChildren(parentNode, symbols) {
        if (Array.isArray(symbols)) {
            symbols = symbols.join(' ')
        }
        let node = this.tree.addNode(parentNode.id)
        node.symbols = symbols
        return node
    }
    addChildrenFromCache(parentNode, cachedNode) {
        parentNode.children.push(cachedNode)
        return cachedNode
    }
    updateScore(node, score) {
        if(node.score === score) {
            return
        }
        node.score = score
    }
    saveSolution(cursor, node) {
        if(this.USE_CACHE) {
            this.saveToCache(cursor, node)
        }
    }
    updateData(node) {
        if(node.children.length === 0) return

        let data = node.children.map(n => n.data).join('')
        node.data = data
    }
    resetChildren(node) {
        node.children = []
    }
    keepBestSolution(node) {
        // s'il n'y a pas plusieurs solution ce n'est pas la peine
        if (node.children.length < 2) {
            return
        }
        let max = Math.max(...node.children.map(n => n.score))
        // console.log("max score: " + max)
        let best = node.children.find(n => n.score === max)
        node.children = [best]
    }
}
