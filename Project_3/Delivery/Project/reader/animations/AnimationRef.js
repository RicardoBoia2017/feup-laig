/**
 * AnimationRef
 * @constructor
 **/

function AnimationRef(animation) {
  this.animation = animation;

  this.matrix = mat4.create();
  mat4.identity(this.matrix);

  this.enable = null;
  this.duration = this.animation.getDuration();
  this.timeCounter = 0; //tempo desde o inicio da animação
}

/* 
* Se a animação estive ativa atualiza a matrix de movimento
*/
AnimationRef.prototype.updateMatrix = function(deltaTime) {

  if (this.enable == true) {//se estiver ativa

    this.timeCounter = this.timeCounter + deltaTime; //atualiza o tempo 

    if (this.timeCounter < this.duration) { //verifica se nao acabou
      this.matrix = this.animation.getMatrix(this.timeCounter); //atualiza a matriz
    } else {
      this.enable = false; //animationRef acabou
      this.reset();

      if (this.animation.id == "piece") this.matrix = this.animation.lastPosition();
    }
  }
};

AnimationRef.prototype.reset = function() {
  if (this.animation.type == "linear") this.animation.reset();
};

AnimationRef.prototype.getMatrix = function() {
  return this.matrix;
};
