class Displayer {
	constructor(draw, groups, verbs) {
		this.groups = groups;
		this.verbs = this.formatVerbs(verbs);
		this.draw = draw;
		let groupWidth = document.body.scrollWidth / Object.values(groups).length * 2;
		let groupHeight = documentHeight / 3;
		this.groupSize = Math.min(groupHeight, groupWidth) / 2
		this.backgroundColor = '#330c61'; // Violet
		this.lineColor = 'white'; // Jaune
		this.draw.rect(this.draw.node.clientWidth, this.draw.node.clientHeight).fill(this.backgroundColor);
		this.drawGroups();
		this.initializeSimulation();
	}

	formatVerbs(verbs) {
		const res = []
		for (let [key, verb] of Object.entries(verbs)) {
			res.push({ source: verb.nodes[0].id, target: verb.nodes[1].id, edge: verb.edge, id: key })
		}
		return res
	}

	drawGroups() {
		let startX = 0;
		let startY = 0;
		for (let [groupId, group] of Object.entries(this.groups)) {
			this.groups[groupId].svg = this.drawGroup(group, startX, startY, this.groupSize);
		}

	}

	initializeSimulation() {
		const [forceCenterX, forceCenterY] = [this.draw.node.clientWidth / 2 - this.groupSize / 2, this.draw.node.clientHeight / 2 - this.groupSize / 2]
		const forceGroups = Object.entries(this.groups).map(([k, v]) => ({ id: k, ...v, radius: this.groupSize / 2 }))
		// Créer une simulation D3
		this.simulation = d3.forceSimulation(forceGroups)
			.force("link", d3.forceLink(this.verbs).id(d => d.id)
				.distance(d => this.groupSize * 2 + this.groupSize / 4)) // Ajustez la distance des liens en fonction de la taille des nœuds
			// .force("charge", d3.forceManyBody().strength(0.005).distanceMax(d => d.radius / 2)) // Utilisez le rayon des nœuds pour définir la distance maximale de répulsion
			.force("collision", d3.forceCollide().radius(d => d.radius * 2).strength(2)) // Utilisez le rayon des nœuds pour détecter les collisions
			.force("center", d3.forceCenter(forceCenterX, forceCenterY).strength(0.05)) // Centrer la simulation dans le SVG

		// this.simulation.tick(200000)

		// Mettre à jour la position des groupes SVG à chaque itération de la simulation
		this.simulation.on("tick", () => {
			this.drawLinks();
			this.updateGroupsPositions();
		});

		this.simulation.tick(1000);

		this.simulation.on("end", () => {
			this.animateNodeOscillation();
		});
	}

	calculateCircleBorderPoint(cx, cy, r, px, py) {
		const dx = px - cx;
		const dy = py - cy;
		const theta = Math.atan2(dy, dx);
		return {
			x: cx + r * Math.cos(theta),
			y: cy + r * Math.sin(theta)
		};
	}

	animateNodeOscillation() {
		/**
		 * Faire bouger les noeuds une fois la simulation de force finie
		 */
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
		const startTime = Date.now()
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
				const rotationSpeed = rotates[index]
				const rotationAngle = rotationSpeed * (((Date.now() - startTime) / 100) % 360); // Ajustez la vitesse de rotation selon vos préférences
				group.svg.rotate(rotationAngle);
			}

			// Demander une nouvelle frame d'animation
			requestAnimationFrame(animate);
		};

		// Démarrer l'animation
		animate();
	}

	drawLinks() {
		/**
		 * Dessiner tous les verbes
		 */
		// Sélectionner le groupe SVG pour les liens s'il existe, sinon le créer
		let linksGroup = this.draw.findOne('.links');
		if (!linksGroup) {
			linksGroup = this.draw.group().addClass('links');
		} else {
			linksGroup.clear(); // Supprimer tous les liens existants
		}

		// Dessiner les liens entre les nœuds
		for (const verb of this.verbs) {
			const group1 = this.groups[verb.source.id];
			const group2 = this.groups[verb.target.id];
			// TODO: handle complex verbal groups
			const verbWord = verb.edge[0]
			if (group1 && group2) {
				this.drawConnection(group1, group2, linksGroup, verbWord.word);
			}
		}
	}

	drawConnection(group1, group2, parentGroup, verb) {
		/**
		 * Dessiner un verbe entre deux groupes
		 */
		const coord1 = this.calculateCircleBorderPoint(group1.x + this.groupSize / 2, group1.y + this.groupSize / 2, this.groupSize / 2, group2.x + this.groupSize / 2, group2.y + this.groupSize / 2);
		const coord2 = this.calculateCircleBorderPoint(group2.x + this.groupSize / 2, group2.y + this.groupSize / 2, this.groupSize / 2, group1.x + this.groupSize / 2, group1.y + this.groupSize / 2);
		const [x1, x2, y1, y2] = [coord1.x, coord2.x, coord1.y, coord2.y]

		const lineLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
		const deltaY = this.groupSize / 8; // Espacement vertical entre les lignes supplémentaires
		const deltaYBorder = this.groupSize / 7;
		const lineWidth = deltaY / 14;
		// Calculer l'angle de la ligne principale
		const angle = Math.atan2(y2 - y1, x2 - x1);

		// Calculer les décalages en x et en y pour les lignes supplémentaires
		const offsetX = deltaY * Math.sin(angle);
		const offsetY = deltaY * Math.cos(angle);
		const offsetXBorder = deltaYBorder * Math.sin(angle);
		const offsetYBorder = deltaYBorder * Math.cos(angle)

		// Dessiner les lignes parallèles
		const line0 = this.draw.line(x1 - offsetXBorder, y1 + offsetYBorder, x2 - offsetXBorder, y2 + offsetYBorder);
		line0.stroke({ color: this.lineColor, width: lineWidth }).addClass('myFilter');
		const line1 = this.draw.line(x1 - offsetX, y1 + offsetY, x2 - offsetX, y2 + offsetY);
		line1.stroke({ color: this.lineColor, width: lineWidth }).addClass('myFilter');
		const line2 = this.draw.line(x1, y1, x2, y2);
		line2.stroke({ color: this.lineColor, width: lineWidth / 2 }).addClass('myFilter');
		const line3 = this.draw.line(x1 + offsetX, y1 - offsetY, x2 + offsetX, y2 - offsetY);
		line3.stroke({ color: this.lineColor, width: lineWidth }).addClass('myFilter');
		const line4 = this.draw.line(x1 + offsetXBorder, y1 - offsetYBorder, x2 + offsetXBorder, y2 - offsetYBorder);
		line4.stroke({ color: this.lineColor, width: lineWidth }).addClass('myFilter');

		const offset = this.groupSize / 12
		const totalDistance = (Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))) - offset;
		const letterSpacing = totalDistance / (verb.length)

		let currentX = x1 + Math.cos(angle) * letterSpacing / 1.5;
		let currentY = y1 + Math.sin(angle) * letterSpacing / 1.5;
		for (let i = 0; i < verb.length; i++) {
			const letter = verb.charAt(i);
			const letterImage = this.draw.image(`./SVG/${letter.toLowerCase()}_white.svg`);
			const letterSize = deltaY * 2; // Taille de la lettre

			letterImage.size(letterSize, letterSize).move(currentX - letterSize / 2, currentY - letterSize / 2);
			letterImage.rotate((angle * 180) / Math.PI, currentX, currentY).addClass('myFilter'); // Rotation en degrés

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
	}

	calculateCircleBorderPoint(cx, cy, r, px, py) {
		const dx = px - cx;
		const dy = py - cy;
		const theta = Math.atan2(dy, dx);
		return {
			x: cx + r * Math.cos(theta),
			y: cy + r * Math.sin(theta)
		};
	}

	updateGroupsPositions() {
		/** Sert à modifier la position des groupes pendant la simulation de force, x et y sont set par l'algo d3 
		et ensuite on doit modifier le svg en fonction **/
		const svgWidth = this.draw.node.clientWidth;
		const svgHeight = this.draw.node.clientHeight;

		this.simulation.nodes().forEach(node => {
			const group = this.groups[node.id];
			if (group) {
				group.x = Math.max(0, Math.min(svgWidth - this.groupSize, node.x)); // Limiter la position x dans la zone visible
				group.y = Math.max(0, Math.min(svgHeight - this.groupSize, node.y)); // Limiter la position y dans la zone visible
				group.svg.attr("transform", `translate(${group.x}, ${group.y})`);
				// Mettez à jour l'affichage des groupes ici si nécessaire
			}
		});
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


		let image = wordGroup.image('./SVG/mot_vide_blanc.svg');
		image.size(size, size).move(originX, originY).addClass("myFilter");

		for (let letter of letters) {
			let letterImage = wordGroup.image(`./SVG/${letter.toLowerCase()}_white.svg`);

			letterImage
				.size(letterWidth, letterHeight)
				.move(centerX - letterWidth / 2, originY + size / 30)
				.rotate(angle, centerX, centerY).addClass('myFilter');

			angle += angleIncrement;
		}

		return wordGroup;
	}
}
