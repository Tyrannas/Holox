class Evaluator {
	/**
     * Class that takes the AST as input and draw the representation of graphs and nodes
     */
	constructor(AST) {
		this.AST = AST;
		// groups are groups of words, words are nodes
		this.groups = {};
		// verbs are edges between groups
		this.verbs = {};
		// store the ids in the form {phraseId: {refId: groupId}}
		this.refs = {};

		this.groupsToDelete = [];

		this.handleTexte(AST);
		this.deleteVerbGroups();
	}

	handleTexte(texteNode) {
		let id = 0;
		// a text is made of phrases, so lets evaluate every phrase
		for (let phrase of texteNode.children) {
			this.handlePhrase(phrase, { phrase: id });
			id++;
		}
	}

	handlePhrase(phraseNode, idContainer) {
		let idGroup = 0;
		let idVerb = 0;
		// a phrase is made of groups or verbs, so lets evaluate every child
		for (let child of phraseNode.children) {
			if (child.type === 'groupe') {
				this.handleGroup(child, { ...idContainer, group: idGroup });
				idGroup++;
			} else if (child.type === 'groupe_verbal') {
				this.handleVerbGroup(child, { ...idContainer, verb: idVerb });
				idVerb++;
			} else {
				throw Error('Unhandled child type : ' + child.type);
			}
		}
	}

	handleVerbGroup(verbGroupNode, idContainer) {
		// in a verb group node we need to create the edges between the groups
		// a verb group is in the form: group action group action group
		let verb = { nodes: [] };
		let children = verbGroupNode.children;

		const idGroup1 = { ...idContainer, group: 0 };
		const idGroupVerb = { ...idContainer, group: 1 };
		const idGroup2 = { ...idContainer, group: 2 };

		verb.nodes.push({ id: this.buildId(idGroup1) }, { id: this.buildId(idGroup2) });

		const strId = this.buildId(idGroupVerb);
		verb.edge = this.buildId(idGroupVerb);
		this.groupsToDelete.push(strId);
		// completer avec les temps et l'orientation qunad le reste sera bon

		this.verbs[this.buildId(idContainer)] = verb;

		this.handleGroup(children[0], idGroup1);
		this.handleGroup(children[2], idGroupVerb);
		this.handleGroup(children[4], idGroup2);
	}

	handleGroup(groupNode, idContainer) {
		let id = this.buildId(idContainer);
		let child = groupNode.children[0];
		this.groups[id] = [];
		// either a word group, a group word + id or a ref to a group
		if (groupNode.children.length === 2) {
			// this means we have an id that will be used to identify the associated groupe_mot in the phrase
			this.refs[idContainer.phrase] = {
				[groupNode.children[1].data.replace(/:/g, '')]: id
			};
		} else if (child.type === 'ref') {
			// a ref can only be used in a verbal group
			// so if me weet a ref we should check the ref table,
			// and the replace the value of the ref in the edges table with the real node ID
			try {
				// get the id of the real group associated to the ref
				let realId = this.refs[idContainer.phrase][child.data.replace(/@/g, '')];
				// get the id of the verb
				let verbId = this.buildId({ phrase: idContainer.phrase, verb: idContainer.verb });
				// get the verb object
				let verb = this.verbs[verbId];
				// replace the id of the group in the verb object by the realId
				// and delete the current group
				for (let node of verb.nodes) {
					if (node.id === id) {
						node.id = realId;
						delete this.groups[id];
					}
					return;
				}
			} catch (err) {
				throw Error('Trying to use a ref before it was referenced' + err);
			}
		}
		// else its just a group
		this.handleWordGroup(groupNode.children[0], idContainer);
	}

	handleWordGroup(groupNode, idContainer) {
		let children = groupNode.children;
		let id = this.buildId(idContainer);
		// a wordgroup is either made of an empty node, a word node, or multipe word nodes
		// if it's a single node
		if (children[0].type === 'empty_node') {
			this.groups[id].push({ word: '' });
			return;
		} else {
			this.handleWordNode(children[0], idContainer);
		}
		let rest = children.slice(1);
		for (let i = 0; i < rest.length; i += 2) {
			// handle the node + the link between the nodes
			this.handleWordNode(rest[i + 1], idContainer, rest[i]);
		}
	}

	handleWordNode(wordNode, idContainer, link = undefined) {
		let children = wordNode.children;
		let word = children[0].data;
		let decoration;
		// a word node is either a word, a word with decoration
		// how to handle stacked decorations??
		if (children.length === 3) {
			if (children[0].data !== children[2].data) {
				throw EvalError(
					'Decorations must be of the same type: ' +
						children[0].data +
						' is differement from ' +
						children[2].data
				);
			}
			decoration = children[0].data;
			word = children[1].data;
		}
		this.groups[this.buildId(idContainer)].push({ word, link, decoration });
	}

	buildId(idContainer) {
		let id = `p${idContainer.phrase}`;
		if ('verb' in idContainer) {
			id += `v${idContainer.verb}`;
		}
		if ('group' in idContainer) {
			id += `g${idContainer.group}`;
		}
		return id;
	}

	deleteVerbGroups() {
		// delete from the group list all groups that are supposed to be drawn as verbs
		for (let idGroup of this.groupsToDelete) {
			for (let [ key, verb ] of Object.entries(this.verbs)) {
				if (verb.edge === idGroup) {
					this.verbs[key].edge = {...this.groups[idGroup]};
					delete this.groups[idGroup];
				}
			}
		}
	}
}
