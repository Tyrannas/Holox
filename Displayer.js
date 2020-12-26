class Displayer {
	constructor(draw, groups, verbs) {
		this.groups = groups;
		this.verbs = verbs;
		this.draw = draw;
		this.drawGroups();
	}

	drawGroups() {
		const groups = Object.values(this.groups);
		const groupWidth = document.body.scrollWidth / groups.length * 2;
		const groupHeight = documentHeight / 2;
		let startX = 0;
		let startY = 0;
		for (let i = 0; i < groups.length; i++) {
			this.drawGroup(groups[i], startX, startY, Math.min(groupHeight, groupWidth));
			startX += groupWidth;
			if (Math.round(startX) >= document.body.scrollWidth) {
				startY += groupHeight;
				startX = 0;
			}
		}
	}

	drawGroup(group, originX, originY, size) {
		console.log(originX);
		let wordSize = size / group.length;
		for (let word of group) {
			this.drawWord(word, originX, originY, wordSize);
			originX += wordSize;
		}
	}
	drawWord(word, originX, originY, size) {
		console.log(originX, originY);
		const letters = word.word.split('');
		let group = this.draw.group();

		const centerX = originX + size / 2;
		const centerY = originY + size / 2;
		const letterHeight = size / 4;
		const letterWidth = letterHeight / 3.08;

		let angle = 0;
		let angleIncrement = 360 / letters.length;

		let image = group.image('./SVG/mot.svg');
		image.size(size, size).move(originX, originY);

		for (let letter of letters) {
			let letterImage = group.image(`./SVG/${letter.toLowerCase()}.svg`);

			letterImage
				.size(letterWidth, letterHeight)
				.move(centerX - letterWidth / 2, originY + size / 30)
				.rotate(angle, centerX, centerY);

			angle += angleIncrement;
		}

		return group;
	}
}
