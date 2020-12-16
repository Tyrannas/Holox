class Evaluator {
    /**
     * Class that takes the AST as input and draw the representation of graphs and nodes
     */
    constructor(AST){
        this.AST = AST
        // groups are groups of words, words are nodes
        this.groups = {}
        // verbs are edges between groups
        this.verbs = {}
        // store the ids in the form {phraseId: {refId: groupId}}
        this.refs = {}

        this.handleTexte(AST)
    }

    handleTexte(texteNode){
        let id = 0;
        // a text is made of phrases, so lets evaluate every phrase
        for(let phrase of texteNode.children){
            this.handlePhrase(phrase, {phrase: id})
            id++;
        }
    }

    handlePhrase(phraseNode, idContainer){
        let idGroup = 0;
        let idVerb = 0;
        // a phrase is made of groups or verbs, so lets evaluate every child
        for(let child of phraseNode.children){
            if(child.type === "groupe"){
                this.handleGroup(child, {...idContainer, group: idGroup})
                idGroup++
            }
            else if(child.type === "groupe_verbal"){
                this.handleVerbGroup(child, {...idContainer, verb: idVerb})
                idVerb++
            }
            else{
                throw Error("Unhandled child type : " + child.type)
            }
        }
    }

    handleGroup(groupNode, idContainer){
        let id = this.buildId(idContainer)
        this.groups[id] = []
        // either a word group or a group word + id
        if(groupNode.children.length === 2){
            // this means we have an id that will be used to identify the associated groupe_mot in the phrase
            this.refs[idContainer.phrase] = {
                [groupNode.children[1].data]: id
            }
        }
        this.handleWordGroup(groupNode.children[0], idContainer)
    }
    
    handleWordGroup(groupNode, idContainer){
        let children = groupNode.children
        let id = this.buildId(idContainer)
        // a wordgroup is either made of an empty node, a word node, or multipe word nodes
        // if it's a single node
        if(children[0].type === "empty_node"){
            this.groups[id].push(this.createWord(""))
            return 
        }
        else{
            this.handleWordNode(children[0], idContainer)
        }
        let rest = children.slice(1)
        for(let i=0; i < rest.length; i+=2){
            // handle the node + the link between the nodes
            this.handleWordNode(rest[i], idContainer, rest[i+1]);
        }
    }

    handleWordNode(wordNode, idContainer, link=undefined){
        let children = wordNode.children
        let word = children[0].data
        let decoration;
        // a word node is either a word, a word with decoration, or a ref
        // how to handle stacked decorations??
        if(children.length === 3){
            if(children[0].data !== children[2].data){
                throw EvalError("Decorations must be of the same type: " + children[0].data + " is differement from " + children[2].data)
            } 
            decoration = children[0].data
            word = children[1].data
        }
        // WHAT TO DO IF ITS A REF??
        // REFS NEED TO BE AN ALIAS FOR GROUP IN THE GRAMMAR, A REF ALWAYS POINTS TO A GROUP NOT A SINGLE WORD
        this.groups[this.buildId(idContainer)].push(this.createWord(word, link, decoration))
    }

    buildId(idContainer){
        let id = `p${idContainer.phrase}`
        if('verb' in idContainer){
            id += `v${idContainer.verb}`
        }
        id += `g${idContainer.group}`
        return id
    }
}

class Group{
    constructor(id){
        this.id = id;
        this.wordsId = 0;
        this.words = {}
    }

    addWord(value, decoration=undefined){
        this.words[this.wordId++] = value
    }
}

function drawWord(word, originX, originY, size){
    const letters = word.split('');
    let group = draw.group();

    const centerX = originX + size / 2;
    const centerY = originY + size / 2;
    const letterHeight = size / 4
    const letterWidth = letterHeight / 3.08

    let angle = 0;
    let angleIncrement = 360 / letters.length;
    
    let image = group.image('./SVG/mot.svg')
    image.size(size, size).move(originX, originY)
    
    for(let letter of letters){
        
        let letterImage = group.image(`./SVG/${letter.toLowerCase()}.svg`)
        
        letterImage
        .size(letterWidth, letterHeight)
        .move(centerX - letterWidth / 2, originY + size / 30)
        .rotate(angle, centerX, centerY)
        
        angle += angleIncrement;
    }

    return group
}