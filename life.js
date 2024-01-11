class Neuron {
	constructor() {
		this.weights = []; // Pesos das conexões com outros neurônios
		this.bias = random(-1, 1); // Bias para o neurônio
	}

	initializeWeights(numConnections) {
		for (let i = 0; i < numConnections; i++) {
			this.weights.push(random(-1, 1));
		}
	}
}

class Brain {
	constructor(numInputs, numHiddenNeurons, numOutputs,id) {
		this.id=id;
		this.inputLayer = [];
		this.hiddenLayer = [];
		this.outputLayer = [];

		// Inicializa neurônios da camada de entrada
		for (let i = 0; i < numInputs; i++) {
			const neuron = new Neuron();
			neuron.initializeWeights(numInputs);
			this.inputLayer.push(neuron);
		}

		// Inicializa neurônios da camada oculta
		for (let i = 0; i < numHiddenNeurons; i++) {
			const neuron = new Neuron();
			neuron.initializeWeights(numInputs);
			this.hiddenLayer.push(neuron);
		}

		// Inicializa neurônios da camada de saída
		for (let i = 0; i < numOutputs; i++) {
			const neuron = new Neuron();
			neuron.initializeWeights(numHiddenNeurons);
			this.outputLayer.push(neuron);
		}
	}

	sigmoid(x) {
		return 1 / (1 + Math.exp(-x)); 
	}

	predict(inputs) {
		this.inputLayerOutputs = this.computeLayerOutputs(inputs, this.inputLayer);

		this.hiddenLayerOutputs = this.computeLayerOutputs(this.inputLayerOutputs, this.hiddenLayer);

		let finalOutputs  = this.computeLayerOutputs(this.hiddenLayerOutputs, this.outputLayer);

		return finalOutputs;
	}

	computeLayerOutputs(inputs, layer) {
		const outputs = [];
		for (let i = 0; i < layer.length; i++) {
			const neuron = layer[i];
			let sum = neuron.bias;
			for (let j = 0; j < neuron.weights.length; j++) {
				sum += (inputs[j] * neuron.weights[j]);
			}
			outputs.push(this.sigmoid(sum));
		}
		return outputs;
	}

	booleanOutput(value){
		return (value > booleanTreshold) ? true : false;
	}
}

class LivingBeing {
	constructor(id) {
		this.id=id;
		this.x = random(width);
		this.y = random(height);
		this.size = beingSize;
		this.energy = inicialEnergy;
		this.brain = new Brain(inputLayers, hiddenLayers, outputLayers,id); 
		this.challenger=null
		this.time = 0;
		this.challenge=false;
		this.color = {'r':0,'g':0,'b':0};
		this.assingColor();
	}

	assingColor(){

		const mapTo255 = (value) =>{
			return Math.floor((value + 1) * 127.5);
		}
		// Função para calcular a média de uma coluna
		
		this.color.r=mapTo255(random(0,1));
		this.color.g=mapTo255(random(0,1));
		this.color.b=mapTo255(random(0,1));
	}

	update() {

		this.time++;

		if (this.time>individualLifetime) {
			this.energy = -1000;
		}

		this.inputs = this.calculateInputs();
		this.outputs = this.brain.predict(this.inputs);
		let speed = this.outputs[0]*baseSpeed;
		if (this.brain.booleanOutput(this.outputs[3])) {
			speed = this.outputs[0]*baseSpeed*jumpSize;
			this.energy -= jumpSize/10;
		}
		const direction = this.outputs[1];

		if (this.challenge && this.brain.booleanOutput(this.outputs[2])) {
			if (this.energy > this.challenger.energy) {
				this.energy+= this.challenger.energy;
				this.challenger.energy = -1000;
				this.challenger = null;
				this.challenge=false;
				countKills++;
			}else{
				this.energy=0;
			}
		}else{
			this.challenger = null;
			this.challenge=false;
		}


		if (this.energy>=inicialEnergy*2) {
			countSelfReplication++;
			countReproduction--;
			this.reproduce(this);
		}

		this.energy-=(this.outputs[0]/5);

		this.x += speed*Math.sin(direction*360);
		this.y += speed*Math.cos(direction*360);

		this.x = constrain(this.x, 0, width);
		this.y = constrain(this.y, 0, height);
		if (this.x<dangerZone || this.y<dangerZone || this.x>width-dangerZone || this.y>height-dangerZone) {
			this.energy--;
		}
	}
	engage(neighbor){
		this.challenge=true;
		this.challenger=neighbor;
	}
	display() {
		if (this.time<=individualLifetime/10) {
			stroke(0,0,0);	
		}else if(this.time > individualLifetime-(individualLifetime/10)){
			stroke(255,0,0);
		}
		fill(this.color.r,this.color.g,this.color.b);
		ellipse(this.x, this.y, random((1-this.energy/inicialEnergy)*this.size,this.size*(1+this.energy/inicialEnergy)), random((1-this.energy/inicialEnergy)*this.size,this.size*(1+this.energy/inicialEnergy)));
		noStroke();


		const lifePercentage = int(((individualLifetime-this.time) / individualLifetime) * 10);

        // Desenha o número no centro do círculo
        fill(0);
        textAlign(CENTER, CENTER);
        text(`${lifePercentage}`, this.x, this.y);
		
	}

	calculateInputs() {
		let inputs = [];
		inputs.push(this.x/width,this.y/height,this.energy/inicialEnergy,this.time/individualLifetime);
		let neighbor = this.closestNeighbor();
		if (neighbor!==null) {
			let similar=calculateSimilarity(this.brain,neighbor.brain);
			let distance = dist(this.x, this.y, neighbor.x, neighbor.y);
			let direction = atan2(neighbor.y - this.y, neighbor.x - this.x) / PI;
			

			if (showAnimation && showLines) {
				stroke(0,0,255);
				line(this.x,this.y,neighbor.x,neighbor.y);
				noStroke();
			}
			if (distance<= this.size) {
				if (similar || reproduceWithNonSimilar) {
					if(!this.reproduce(neighbor)){
						this.engage(neighbor);
					}
				}else{
					this.engage(neighbor);
				}
			}

			inputs.push(distance/width, direction,neighbor.energy/inicialEnergy,neighbor.time/individualLifetime,similar);
		}else{
			inputs.push(0,0,0,0,0);
		}
		let nearFood = this.closestFood();
		if (nearFood!==null) {
			let distance = dist(this.x, this.y, nearFood.x, nearFood.y);
			let direction = atan2(nearFood.y - this.y, nearFood.x - this.x) / PI;
			if (showAnimation && showLines) {
				stroke(255,0,0);
				line(this.x,this.y,nearFood.x,nearFood.y);
				noStroke();
			}

			if (distance<= this.size) {
				this.energy+= nearFood.energy;
				this.time-=foodLifeIncrease;
				nearFood.kill();
				//continue;
			}
			inputs.push(distance/width, direction,nearFood.energy/foodEnergy);
		}else{
			inputs.push(0,0,0);
		}

		return inputs;
	}

	closestNeighbor() {
		let closestNeighbor = null;
		let closestDistance = Infinity;

		for (const other of population) {
			if (other !== this) {
				const distance = dist(this.x, this.y, other.x, other.y);

				if (distance < closestDistance) {
					closestDistance = distance;
					closestNeighbor = other;
				}
			}
		}

		return closestNeighbor;
	}

	closestFood() {
		let closestFood = null;
		let closestDistance = Infinity;

		for (const f of food) {
			const distance = dist(this.x, this.y, f.x, f.y);

			if (distance < closestDistance) {
				closestDistance = distance;
				closestFood = f;
			}
		}

		return closestFood;
	}

	reproduce(partner,force=false) {
		// Verifica se há energia suficiente para reprodução
		if ((this.energy >= partner.energy && partner.energy >= inicialEnergy*0.8)||force) {
			
			countReproduction++;

			// Gasta uma quantidade significativa de energia para reprodução
			
			if(!force){
				this.energy -= inicialEnergy/4;
				partner.energy -= inicialEnergy/4;
			}

			// Cria um novo ser vivo como descendente
			const child = new LivingBeing(incrementPopulation++);
			child.energy = childEnergy;
			// Herda características dos pais (pode ajustar conforme necessário)
			child.x = (this.x + partner.x) / 2;
			child.y = (this.y + partner.y) / 2;

			child.color.r = (this.color.r + partner.color.r) / 2;
			child.color.g = (this.color.g + partner.color.g) / 2;
			child.color.b = (this.color.b + partner.color.b) / 2;
			// Pode herdar a rede neural dos pais ou ter uma inicialização própria
			child.brain = this.inheritNeuralNetwork(partner.brain,child.id);
			// Pode ajustar outras características ou lógicas de herança

			// Adiciona o novo ser vivo à população
			population.push(child);
			return true;
			
		}
		return false;
	}

	crossoverLayer(parentLayer1,parentLayer2){
		const crossoverPoint = floor(random(parentLayer1.length));
		let childLayer = [];

		// Herança até o ponto de crossover
		for (let i = 0; i < parentLayer1.length; i++) {
				const childNeuron = new Neuron();
				let parentNeuron;

				if (i < crossoverPoint) {
						parentNeuron = parentLayer1[i];
				} else {
						parentNeuron = parentLayer2[i];
				}

				childNeuron.initializeWeights(parentNeuron.weights.length);
				childNeuron.bias = this.mutate(parentNeuron.bias);

				for (let j = 0; j < childNeuron.weights.length; j++) {
						childNeuron.weights[j] = this.mutate(parentNeuron.weights[j]);
				}

				childLayer.push(childNeuron);
		}
		return childLayer;
	}

	inheritNeuralNetwork(parentBrain,childId) {
		const childBrain = new Brain(inputLayers, hiddenLayers, outputLayers, childId);

		childBrain.inputLayer  = this.crossoverLayer(this.brain.inputLayer,parentBrain.inputLayer);
		childBrain.hiddenLayer = this.crossoverLayer(this.brain.hiddenLayer,parentBrain.hiddenLayer);
		childBrain.outputLayer = this.crossoverLayer(this.brain.outputLayer,parentBrain.outputLayer);

		return childBrain;
	}

	mutate(value) {

		const normColor = (being) =>{
			const minmax = (value) =>{
				if(value > 255){
					return 0;
				}else if(value<0){
					return 255;
				}else{
					return value;
				}
			}	
			being.color.r = minmax(being.color.r);
			being.color.g = minmax(being.color.g);
			being.color.b = minmax(being.color.b);
		}
		// Adicionar uma pequena alteração aleatória com base na taxa de mutação
		if (random() < mutationRate) {
				const mutationAmount = random(-mutationRate, mutationRate); // Ajuste conforme necessário
				
				this.color.r+=random(-2,2);
				this.color.g+=random(-2,2);
				this.color.b+=random(-2,2);
				normColor(this);
				value += mutationAmount;
		}
		return value;
	}

	kill(){
		population=population.filter(other => other !== this);
	}
}

class Food {
	constructor(id){
		this.id=id;
		this.x = random(width);
		this.y = random(height);
		this.size = 10;
		this.energy = random(1,foodEnergy);
		this.direction = random(0,1);
		this.speed = random(0,1);
	}

	display(){
		fill((this.energy/foodEnergy)*255, 20, 20);
		ellipse(this.x, this.y, random(1,this.size), random(1,this.size));
	}

	update(){
		this.energy++;
		this.x += this.speed*Math.sin(this.direction*360);
		this.y += this.speed*Math.cos(this.direction*360);

		if (this.x>=width || this.y>=height || this.y<=0 || this.x<=0) {
			if(this.y<=0 || this.x<=0){
				this.x+=5;
				this.y+=5;	
			}else{
				this.x-=5;
				this.y-=5;
			}
			this.direction = random(0,1);
		}

	}
	kill(){
		food=food.filter(other => other !== this);
	}
}
var population = [];
var food=[];

var incrementFood=0;
var incrementPopulation=0;
var iteration=0;

var inputLayers=12;
var hiddenLayers=16;
var outputLayers=4;


var countKills=0;
var countSelfReplication=0;
var countReproduction =0;

var generateInitialPopulation = true;
var populationSize = 1000;
var inicialEnergy = 500;


var booleanTreshold = 0.5;
var childEnergy = 100;
var foodEnergy = 10;
var baseSpeed=6.5;
var mutationRate = 0.05;
var dangerZone=0;
var individualLifetime = 30000;
var beingSize = 20;

var showAnimation = true;
var showStatistics = true;
var showLines = false;


var autosave=true;
var autoload=false;

var autoSeasonFood=true;
var foodSize=200;
var intervalChangeFood=100000;
var minimumFood = 100;
var minimumPopulationStarvation = 10;
var resetFood = 200;
var foodLifeIncrease = 0;
var jumpSize = 10;
var reproduceWithNonSimilar=true;
var generateRandomPopulation = true;
var randomGenerationRate= 100; //menor valor aumenta frequencia

function setup() {

	initParameters();
	createCanvas(windowWidth-245, windowHeight-20);
	if (localStorage.getItem('auto')!=null && autoload) {
		getSavedData('auto');


	}else{
		if (generateInitialPopulation) {
			for (let i = 0; i < populationSize; i++) {
				population.push(new LivingBeing(i));
				incrementPopulation++;
				food.push(new Food(i));
				incrementFood++;
				food.push(new Food(i));
				incrementFood++;
			}
		}
	}
	setInterval(function(){ 
		if (population.length>=20 && autosave) {
			localStorage.setItem('auto',JSON.stringify(population)); 
		}
	},30000);
	setInterval(function(){
		if(autoSeasonFood){
			if (foodSize<minimumFood || population.length<minimumPopulationStarvation) {
				foodSize=resetFood;
			}
		}
	},intervalChangeFood/20);
	setInterval(function(){
		if(autoSeasonFood){
			foodSize--;
		}
	},intervalChangeFood);
}

function draw() {
	if (showAnimation) {
		background(255,150,150);
		stroke(0,0,0);
		fill(220,220,220);
		rect(dangerZone,dangerZone,width-dangerZone*2,height-dangerZone*2);
		//rect(150,150,500,300);
		noStroke();
	}

	for (let i = 0; i < population.length; i++) {
		population[i].update();
		if (population[i].energy<=0) {
			population[i].kill();
			continue;
		}
		if (showAnimation) {
			population[i].display();
		}
	}

	if (showAnimation) {
		for ( i = 0; i < food.length; i++) {
			//food[i].energy++;
			food[i].display();
		}
	}
	if (food.length<foodSize) {
		food.push(new Food(incrementFood++));
	}
	if (iteration%(Math.ceil(random()*randomGenerationRate))===0 && generateRandomPopulation) {
		a=new LivingBeing(incrementPopulation++);
		population.push(a);
		//a.reproduce(population[Math.floor(random(0,population.length-1))],true);	
	}
	iteration++;
	if (showAnimation || showStatistics) {
		displayNeuralInfo();
	}
}

function displayNeuralInfo() {
	const neuralInfoDiv = documents.getElementById('neuralInfo');
	let html = '';

	// html+= '<table border=1>';
	

	// for (let i = 0; i < 0; i++) {
		
	// 	html+='<tr>';
	// 	html+='<td>'+population[i].id+'</td>';
	// 	for(let index=0;index<inputLayers;index++){
	// 		html+='<td>'+population[i].inputs[index].toFixed(4)+'</td>';
	// 	}
	// 	for(let index=0;index<inputLayers;index++){
	// 		html+='<td>'+population[i].brain.inputLayerOutputs[index].toFixed(4)+'</td>';
	// 	}
	// 	for(let index=0;index<4;index++){
	// 		html+='<td>'+population[i].brain.hiddenLayerOutputs[index].toFixed(4)+'</td>';
	// 	}
	// 	html+='<td>'+population[i].outputs[0].toFixed(4)+'</td>';
	// 	html+='<td>'+population[i].outputs[1].toFixed(4)+'</td>';
	// 	html+='</tr>';		
	// }
	// html+= '</table>';

	html += "<b>iteração: </b>"+iteration;
	html += "<br>";
	html += "<b>populacao: </b>"+population.length;
	html += "<br>";
	html += "<b>comida: </b>"+food.length;
	html += "<br>";
	html += "<b>mortes: </b>"+countKills;
	html += "<br>";
	html += "<b>replicacao: </b>"+countSelfReplication;
	html += "<br>";
	html += "<b>reprodução: </b>"+countReproduction;
	neuralInfoDiv.innerHTML = html;
}

function getSavedData(key){
	population = JSON.parse(localStorage.getItem(key)).map(beingData => {
		const being = new LivingBeing(beingData.id);
		being.x = beingData.x;
		being.y = beingData.y;
		being.size = beingData.size;
		being.energy = beingData.energy;

		// Reconstruir o cérebro
		being.brain = new Brain(beingData.brain.inputLayer.length, beingData.brain.hiddenLayer.length, beingData.brain.outputLayer.length, beingData.brain.id);
		being.brain.inputLayer = beingData.brain.inputLayer.map(neuronData => {
			const neuron = new Neuron();
			neuron.weights = neuronData.weights;
			neuron.bias = neuronData.bias;
			return neuron;
		});

		being.brain.hiddenLayer = beingData.brain.hiddenLayer.map(neuronData => {
			const neuron = new Neuron();
			neuron.weights = neuronData.weights;
			neuron.bias = neuronData.bias;
			return neuron;
		});

		being.brain.outputLayer = beingData.brain.outputLayer.map(neuronData => {
			const neuron = new Neuron();
			neuron.weights = neuronData.weights;
			neuron.bias = neuronData.bias;
			return neuron;
		});

		return being;
	});
	incrementPopulation = population[population.length-1].id;
}

function saveData(key){
	if (localStorage.getItem('key')===null) {
		localStorage.setItem(key,JSON.stringify(population));
	}else{
		console.log('Chave já usada. informe outra chave');
	}
}

getMoreFood = function(){
	if(moreFood){
		food.push(new Food(incrementFood++));
	}
}

function calculateSimilarity(neuralNetworkA, neuralNetworkB) {
	if (reproduceWithNonSimilar) {
		return true;
	}
	const similarityThreshold = 0.8; // Ajuste conforme necessário

	// Extrair os pesos e biases das conexões de cada camada
	const weightsAndBiasesInputLayerA = neuralNetworkA.inputLayer.map(neuron => [...neuron.weights, neuron.bias]);
	const weightsAndBiasesHiddenLayerA = neuralNetworkA.hiddenLayer.map(neuron => [...neuron.weights, neuron.bias]);
	const weightsAndBiasesOutputLayerA = neuralNetworkA.outputLayer.map(neuron => [...neuron.weights, neuron.bias]);

	const weightsAndBiasesInputLayerB = neuralNetworkB.inputLayer.map(neuron => [...neuron.weights, neuron.bias]);
	const weightsAndBiasesHiddenLayerB = neuralNetworkB.hiddenLayer.map(neuron => [...neuron.weights, neuron.bias]);
	const weightsAndBiasesOutputLayerB = neuralNetworkB.outputLayer.map(neuron => [...neuron.weights, neuron.bias]);

	// Calcular a diferença absoluta média para cada camada
	const madInputLayer = calculateMAD(weightsAndBiasesInputLayerA, weightsAndBiasesInputLayerB);
	const madHiddenLayer = calculateMAD(weightsAndBiasesHiddenLayerA, weightsAndBiasesHiddenLayerB);
	const madOutputLayer = calculateMAD(weightsAndBiasesOutputLayerA, weightsAndBiasesOutputLayerB);

	// Calcular a taxa de semelhança
	const similarityInputLayer = 1 - madInputLayer;
	const similarityHiddenLayer = 1 - madHiddenLayer;
	const similarityOutputLayer = 1 - madOutputLayer;

	// Calcular a média da taxa de semelhança entre as camadas
	const averageSimilarity = (similarityInputLayer + similarityHiddenLayer + similarityOutputLayer) / 3;

	// Verificar se a média da taxa de semelhança atende ao limiar
	const isSimilar = averageSimilarity >= similarityThreshold;

	return isSimilar;
}

// Função para calcular a diferença absoluta média entre dois conjuntos de pesos e biases
function calculateMAD(weightsAndBiasesA, weightsAndBiasesB) {
	const totalWeightsAndBiases = weightsAndBiasesA.length * weightsAndBiasesA[0].length;
	let sumAbsoluteDifference = 0;

	for (let i = 0; i < weightsAndBiasesA.length; i++) {
		for (let j = 0; j < weightsAndBiasesA[i].length; j++) {
			sumAbsoluteDifference += Math.abs(weightsAndBiasesA[i][j] - weightsAndBiasesB[i][j]);
		}
	}

	const mad = sumAbsoluteDifference / totalWeightsAndBiases;
	return mad;
}

function initParameters(){
	if(localStorage.generateInitialPopulation !== undefined) {
		generateInitialPopulation=localStorage.getItem('generateInitialPopulation');
	}

	if(localStorage.populationSize !== undefined) {
		populationSize=localStorage.getItem('populationSize');
	}

	if(localStorage.inicialEnergy !== undefined) {
		inicialEnergy=localStorage.getItem('inicialEnergy');
	}



	if(localStorage.booleanTreshold !== undefined) {
		booleanTreshold=localStorage.getItem('booleanTreshold');
	}

	if(localStorage.childEnergy !== undefined) {
		childEnergy=localStorage.getItem('childEnergy');
	}

	if(localStorage.foodEnergy !== undefined) {
		foodEnergy=localStorage.getItem('foodEnergy');
	}

	if(localStorage.baseSpeed !== undefined) {
		baseSpeed=localStorage.getItem('baseSpeed');
	}

	if(localStorage.mutationRate !== undefined) {
		mutationRate=localStorage.getItem('mutationRate');
	}

	if(localStorage.dangerZone !== undefined) {
		dangerZone=localStorage.getItem('dangerZone');
	}

	if(localStorage.individualLifetime !== undefined) {
		individualLifetime=localStorage.getItem('individualLifetime');
	}

	if(localStorage.beingSize !== undefined) {
		beingSize=localStorage.getItem('beingSize');
	}


	if(localStorage.showAnimation !== undefined) {
		showAnimation=localStorage.getItem('showAnimation');
	}

	if(localStorage.showStatistics !== undefined) {
		showStatistics=localStorage.getItem('showStatistics');
	}

	if(localStorage.showLines !== undefined) {
		showLines=localStorage.getItem('showLines');
	}



	if(localStorage.autosave !== undefined) {
		autosave=localStorage.getItem('autosave');
	}

	if(localStorage.autoload !== undefined) {
		autoload=localStorage.getItem('autoload');
	}


	if(localStorage.autoSeasonFood !== undefined) {
		autoSeasonFood=localStorage.getItem('autoSeasonFood');
	}

	if(localStorage.foodSize !== undefined) {
		foodSize=localStorage.getItem('foodSize');
	}

	if(localStorage.intervalChangeFood !== undefined) {
		intervalChangeFood=localStorage.getItem('intervalChangeFood');
	}

	if(localStorage.minimumFood !== undefined) {
		minimumFood=localStorage.getItem('minimumFood');
	}

	if(localStorage.minimumPopulationStarvation !== undefined) {
		minimumPopulationStarvation=localStorage.getItem('minimumPopulationStarvation');
	}

	if(localStorage.resetFood !== undefined) {
		resetFood=localStorage.getItem('resetFood');
	}

	if(localStorage.foodLifeIncrease !== undefined) {
		foodLifeIncrease=localStorage.getItem('foodLifeIncrease');
	}

	if(localStorage.jumpSize !== undefined) {
		jumpSize=localStorage.getItem('jumpSize');
	}

	if(localStorage.reproduceWithNonSimilar !== undefined) {
		reproduceWithNonSimilar=localStorage.getItem('reproduceWithNonSimilar');
	}

	if(localStorage.generateRandomPopulation !== undefined) {
		generateRandomPopulation=localStorage.getItem('generateRandomPopulation');
	}

	if(localStorage.randomGenerationRate !== undefined) {
		randomGenerationRate=localStorage.getItem('randomGenerationRate');
	}

	document.getElementById('generateInitialPopulation').checked=generateInitialPopulation;
	document.getElementById('populationSize').value=populationSize;
	document.getElementById('inicialEnergy').value=inicialEnergy;
	document.getElementById('booleanTreshold').value=booleanTreshold;
	document.getElementById('childEnergy').value=childEnergy;
	document.getElementById('foodEnergy').value=foodEnergy;
	document.getElementById('baseSpeed').value=baseSpeed;
	document.getElementById('mutationRate').value=mutationRate;
	document.getElementById('dangerZone').value=dangerZone;
	document.getElementById('individualLifetime').value=individualLifetime;
	document.getElementById('beingSize').value=beingSize;
	document.getElementById('showAnimation').checked=showAnimation;
	document.getElementById('showStatistics').checked=showStatistics;
	document.getElementById('showLines').checked=showLines;
	document.getElementById('autosave').checked=autosave;
	document.getElementById('autoload').checked=autoload;
	document.getElementById('autoSeasonFood').checked=autoSeasonFood;
	document.getElementById('foodSize').value=foodSize;
	document.getElementById('intervalChangeFood').value=intervalChangeFood;
	document.getElementById('minimumFood').value=minimumFood;
	document.getElementById('minimumPopulationStarvation').value=minimumPopulationStarvation;
	document.getElementById('resetFood').value=resetFood;
	document.getElementById('foodLifeIncrease').value=foodLifeIncrease;
	document.getElementById('jumpSize').value=jumpSize;
	document.getElementById('reproduceWithNonSimilar').checked=reproduceWithNonSimilar;
	document.getElementById('generateRandomPopulation').checked=generateRandomPopulation;
	document.getElementById('randomGenerationRate').value=randomGenerationRate;

}