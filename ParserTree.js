class ParserTree {
    constructor() {
        this.nodes = [makeNode(0)]
    }
    addNode(parentNodeId) {
        let node = makeNode(this.nodes.length)
        this.nodes.push(node)
        this.nodes[parentNodeId].children.push(node)
        return node
    }
    getNode(id) {
        return this.nodes[id]
    }
    getRootNode() {
        return this.getNode(0)
    }
    toTreantTree() {
        return this.toTreantNode(this.getRootNode().children[0])
    }
    toTreantNode(node) {
        let n = {
            text: { 
                name: node.symbols + ":" + node.score,
                data: node.data
            },
            children: []
        }
        n.HTMLclass = "blue"

        if(node.children.length === 0) {
            n.HTMLclass = "green"
        }

        node.children.forEach(child => {
            n.children.push(this.toTreantNode(child))
        })
        return n
    }
}

function makeNode(id) {
    return {
        id: id,
        symbols: undefined,
        data: "",
        score: 0,
        children: []
    }
}