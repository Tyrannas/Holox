class Displayer {
	constructor(draw, groups, verbs) {
		this.groups = groups;
		this.verbs = verbs;
		this.draw = draw;
		let groupWidth = document.body.scrollWidth / Object.values(groups).length * 2;
		let groupHeight = documentHeight / 3;
		this.groupSize = Math.min(groupHeight, groupWidth)
		this.backgroundColor = 'white'; // Violet
        this.lineColor = 'black'; // Jaune
		this.draw.rect(this.draw.node.clientWidth, this.draw.node.clientHeight).fill(this.backgroundColor);
		this.drawGroups();
		this.initializeSimulation();
	}

	drawGroups() {
		let startX = 0;
		let startY = 0;
		for (let [groupId, group] of Object.entries(this.groups)) {
			this.groups[groupId].svg = this.drawGroup(group, startX, startY, this.groupSize);
		}

	}

	initializeSimulation() {
		// Créer une simulation D3
		this.simulation = d3.forceSimulation(Object.values(this.groups))
			.force("link", d3.forceLink(this.verbs).id(d => d.id).distance(0))
			.force("charge", d3.forceManyBody().strength(-this.groupSize * 4))
			.force("center", d3.forceCenter(this.draw.node.clientWidth / 2 - this.groupSize / 2, this.draw.node.clientHeight / 2 - this.groupSize / 2)) // Centrer la simulation dans le SVG

		// Mettre à jour la position des groupes SVG à chaque itération de la simulation
		this.simulation.on("tick", () => {
			this.drawLinks();
			this.updateGroupsPositions();
		});

		this.simulation.on("end", () => {
			this.animateNodeOscillation();
		});
	}

	animateNodeOscillation() {
		// Définir les paramètres d'oscillation
		const randomInRange = (min, max, threshold) => {
			let res = 0
			while (Math.abs(res) < threshold) {
				res = min + Math.random() * (max - min);
			}
			return res
		};
		const frequencies = Object.values(this.groups).map(_ => randomInRange(0.0003, 0.0008, 0.0003))
		const amplitudes = Object.values(this.groups).map(_ => randomInRange(-0.30, 0.30, 0.15))
		const rotates = Object.values(this.groups).map(_ => randomInRange(-0.0025, 0.0025, 0.001))
		console.log(frequencies)
		// Fonction d'animation
		const animate = () => {
			// Appliquer l'oscillation à chaque nœud
			for (const [index, group] of Object.values(this.groups).entries()) {
				const xOffset = amplitudes[index] * Math.sin(frequencies[index] * Date.now());
				const yOffset = amplitudes[index] * Math.cos(frequencies[index] * Date.now());
				group.svg.translate(xOffset, yOffset);
				group.x += xOffset;
				group.y += yOffset;
				this.drawLinks()
				const rotationAngle = rotates[index] * (Date.now() % 360); // Ajustez la vitesse de rotation selon vos préférences
				group.svg.rotate(rotationAngle);
			}

			// Demander une nouvelle frame d'animation
			requestAnimationFrame(animate);
		};

		// Démarrer l'animation
		animate();
	}

	drawLinks() {
		// Sélectionner le groupe SVG pour les liens s'il existe, sinon le créer
		let linksGroup = this.draw.findOne('.links');
		if (!linksGroup) {
			linksGroup = this.draw.group().addClass('links');
		} else {
			linksGroup.clear(); // Supprimer tous les liens existants
		}

		// Dessiner les liens entre les nœuds
		for (const verb in this.verbs) {
			const nodes = this.verbs[verb].nodes;
			const groupId1 = nodes[0].id;
			const groupId2 = nodes[1].id;
			const group1 = this.groups[groupId1];
			const group2 = this.groups[groupId2];
			// TODO: handle complex verbal groups
			const verbWord = this.verbs[verb].edge[0]
			if (group1 && group2) {
				this.drawConnection(group1, group2, linksGroup, verbWord.word);
			}
		}
	}



	drawConnection(group1, group2, parentGroup, verb) {
		const x1 = group1.x + this.groupSize / 2;
		const y1 = group1.y + this.groupSize / 2;
		const x2 = group2.x + this.groupSize / 2;
		const y2 = group2.y + this.groupSize / 2;

		const lineLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
		const deltaY = 40; // Espacement vertical entre les lignes supplémentaires
		const deltaYBorder = 50;
		// Calculer l'angle de la ligne principale
		const angle = Math.atan2(y2 - y1, x2 - x1);

		// Calculer les décalages en x et en y pour les lignes supplémentaires
		const offsetX = deltaY * Math.sin(angle);
		const offsetY = deltaY * Math.cos(angle);
		const offsetXBorder = deltaYBorder * Math.sin(angle);
		const offsetYBorder = deltaYBorder * Math.cos(angle)

		// Dessiner les lignes parallèles
		const line0 = this.draw.line(x1 - offsetXBorder, y1 + offsetYBorder, x2 - offsetXBorder, y2 + offsetYBorder);
		line0.stroke({ color: this.lineColor, width: 4 });
		const line1 = this.draw.line(x1 - offsetX, y1 + offsetY, x2 - offsetX, y2 + offsetY);
		line1.stroke({ color: this.lineColor, width: 4 });
		const line2 = this.draw.line(x1, y1, x2, y2);
		line2.stroke({ color: this.lineColor, width: 2 });
		const line3 = this.draw.line(x1 + offsetX, y1 - offsetY, x2 + offsetX, y2 - offsetY);
		line3.stroke({ color: this.lineColor, width: 4 });
		const line4 = this.draw.line(x1 + offsetXBorder, y1 - offsetYBorder, x2 + offsetXBorder, y2 - offsetYBorder);
		line4.stroke({ color: this.lineColor, width: 4 });

		const startX = x1 + (x2 - x1) * (this.groupSize / 1.5) / lineLength;
		const endX = x1 + (x2 - x1) * (lineLength - this.groupSize / 1.5) / lineLength;
		const startY = y1 + (y2 - y1) * (this.groupSize / 1.5) / lineLength;
		const endY = y1 + (y2 - y1) * (lineLength - this.groupSize / 1.5) / lineLength;

		const totalDistance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
		const letterSpacing = totalDistance / (verb.length - 1)
		
		let currentX = startX; // Début de la partie visible de la ligne
		let currentY = startY; // Début de la partie visible de la ligne
		for (let i = 0; i < verb.length; i++) {
			const letter = verb.charAt(i);
			const letterImage = this.draw.image(`./SVG/${letter.toLowerCase()}.svg`);
			letterImage.fill(this.lineColor);
			const letterSize = deltaY * 2; // Taille de la lettre

			letterImage.size(letterSize, letterSize).move(currentX - letterSize / 2, currentY - letterSize / 2);
			letterImage.rotate((angle * 180) / Math.PI, currentX, currentY); // Rotation en degrés

			parentGroup.add(letterImage);

			// Mettre à jour les coordonnées pour la prochaine lettre
			currentX += Math.cos(angle) * letterSpacing;
			currentY += Math.sin(angle) * letterSpacing;
		}

		parentGroup.add(line1);
		parentGroup.add(line2);
		parentGroup.add(line3);
		parentGroup.add(line0);
		parentGroup.add(line4);

		parentGroup.add(group1.svg);
		parentGroup.add(group2.svg);
	}

	updateGroupsPositions() {
		const svgWidth = this.draw.node.clientWidth;
		const svgHeight = this.draw.node.clientHeight;
		// Mettre à jour la position des groupes SVG à chaque itération de la simulation
		for (const groupId in this.groups) {
			const group = this.groups[groupId];
			group.x = Math.max(0, Math.min(svgWidth - this.groupSize, group.x)); // Limiter la position x dans la zone visible
			group.y = Math.max(0, Math.min(svgHeight - this.groupSize, group.y)); // Limiter la position y dans la zone visible
			group.svg.attr("transform", `translate(${group.x}, ${group.y})`);
		}
	}


	drawGroup(group, originX, originY, size) {
		let wordSize = size / group.length;
		let svgGroup = this.draw.group();
		if (group.length > 1) {
			this.drawWord({ word: "" }, svgGroup, originX, originY, size);
		}
		originY = originY - ((wordSize - size) / 2)
		for (let word of group) {
			this.drawWord(word, svgGroup, originX, originY, wordSize);
			originX += wordSize;
		}
		return svgGroup
	}
	drawWord(word, parentGroup, originX, originY, size) {
		const letters = word.word.split('');
		let wordGroup = this.draw.group();
		parentGroup.add(wordGroup);

		const centerX = originX + size / 2;
		const centerY = originY + size / 2;
		const letterHeight = size / 4;
		const letterWidth = letterHeight / 3.08;

		let angle = 0;
		let angleIncrement = 360 / letters.length;

		let image = wordGroup.image('./SVG/mot.svg');
		image.fill(this.lineColor);
		image.size(size, size).move(originX, originY);

		for (let letter of letters) {
			let letterImage = wordGroup.image(`./SVG/${letter.toLowerCase()}.svg`);
			letterImage.fill(this.lineColor);

			letterImage
				.size(letterWidth, letterHeight)
				.move(centerX - letterWidth / 2, originY + size / 30)
				.rotate(angle, centerX, centerY);

			angle += angleIncrement;
		}

		return wordGroup;
	}

	// drawConnection(group1, group2) {
	// 	const bbox1 = group1.bbox(); // Récupérer la boîte englobante du premier groupe
	// 	const bbox2 = group2.bbox(); // Récupérer la boîte englobante du deuxième groupe

	// 	// Calculer les coordonnées du centre des deux groupes
	// 	const centerX1 = bbox1.cx;
	// 	const centerY1 = bbox1.cy;
	// 	const centerX2 = bbox2.cx;
	// 	const centerY2 = bbox2.cy;

	// 	// Dessiner une ligne entre les centres des deux groupes
	// 	const line = this.draw.line(centerX1, centerY1, centerX2, centerY2);
	// 	line.stroke({ color: 'black', width: 2 }); // Style de la ligne (couleur, épaisseur)
	// }
}
