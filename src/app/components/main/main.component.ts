import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import {
  faArrowPointer,
  faBrush,
  faEraser,
  faFillDrip,
  faMagnifyingGlassMinus,
  faMagnifyingGlassPlus,
  faPalette,
  faPencil,
  faSquareFull,
  faWandMagicSparkles,
  faObjectUngroup,
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
})
export class MainComponent implements OnInit {
  brushIcon = faBrush;
  pointerIcon = faArrowPointer;
  squareIcon = faSquareFull;
  wandIcon = faWandMagicSparkles;
  zoomInIcon = faMagnifyingGlassPlus;
  zoomOutIcon = faMagnifyingGlassMinus;
  pencilIcon = faPencil;
  eraserIcon = faEraser;
  fillIcon = faFillDrip;
  paletteIcon = faPalette;
  selectIcon = faObjectUngroup;

  width = 500;
  height = 500;

  canvas: any = undefined;
  ctx: any = undefined;
  pos: { x: number; y: number } = { x: 0, y: 0 };
  brushSize = 3;
  selectedColor = '#000000';

  isIdle = true;

  private currentTool = 'pointer';
  private selection: any = undefined;
  private isSelecting: boolean = false;
  private startX: number = 0;
  private startY: number = 0;

  private history: any[] = [];
  private historyIndex: number = -1;

  ngOnInit(): void {
    this.canvas = document.getElementById('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.width = '500px';
    this.canvas.style.height = '500px';
  }

  setTool(tool: string) {
    if (tool == 'eraser') {
      this.enableEraser();
    } else {
      this.disableEraser();
    }
    this.currentTool = tool;
    console.log('Tool: ' + tool);
  }

  act(e: any) {
    if (this.currentTool == 'zoomIn' || this.currentTool == 'zoomOut') {
      this.zoom(e, this.currentTool);
      this.canvas.style.width = this.width + 'px';
      this.canvas.style.height = this.height + 'px';
    }
    if (this.currentTool == 'fill') {
      this.ctx.fillStyle = this.selectedColor;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  setPosition(e: any) {
    const rect = this.canvas.getBoundingClientRect();

    this.pos.x = (e.offsetX / rect.width) * this.canvas.width;
    this.pos.y = (e.offsetY / rect.height) * this.canvas.height;

    this.pos.x = Math.max(0, Math.min(this.canvas.width, this.pos.x));
    this.pos.y = Math.max(0, Math.min(this.canvas.height, this.pos.y));
  }

  zoom(e: any, type: string) {
    const zoomFactor = type == 'zoomOut' ? 0.9 : 1.1;

    const clickX = e.clientX - this.canvas.getBoundingClientRect().left;
    const clickY = e.clientY - this.canvas.getBoundingClientRect().top;

    const newCenterX = clickX / this.width;
    const newCenterY = clickY / this.height;

    this.width *= zoomFactor;
    this.height *= zoomFactor;

    const newX = newCenterX * this.width;
    const newY = newCenterY * this.height;

    this.canvas.style.left = `${
      parseInt(this.canvas.style.left || '0') - (newX - clickX)
    }px`;
    this.canvas.style.top = `${
      parseInt(this.canvas.style.top || '0') - (newY - clickY)
    }px`;

    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
  }

  saveCanvasState() {
    // Clear redo history beyond current index
    this.history.length = this.historyIndex + 1;

    const imageData = this.ctx.getImageData(
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );
    this.history.push(imageData);
    this.historyIndex = this.history.length - 1;
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const previousState = this.history[this.historyIndex];
      this.ctx.putImageData(previousState, 0, 0);
    }
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      const nextState = this.history[this.historyIndex];
      this.ctx.putImageData(nextState, 0, 0);
    }
  }

  drawstart(event: any) {
    this.saveCanvasState();
    if (this.currentTool === 'select') {
      this.startSelection(event);
    } else {
      this.saveCanvasState();
      this.ctx.beginPath();
      this.ctx.moveTo(
        event.pageX -
          (this.canvas.getBoundingClientRect().left -
            document.documentElement.getBoundingClientRect().left),
        event.pageY -
          (this.canvas.getBoundingClientRect().top -
            document.documentElement.getBoundingClientRect().top)
      );
    }
    this.isIdle = false;
  }

  drawmove(event: any) {
    if (this.isIdle) return;

    if (this.currentTool === 'select') {
      this.updateSelection(event);
    } else if (this.currentTool === 'pencil' || this.currentTool === 'eraser') {
      this.ctx.lineCap = 'round';

      this.ctx.lineTo(
        event.pageX -
          (this.canvas.getBoundingClientRect().left -
            document.documentElement.getBoundingClientRect().left),
        event.pageY -
          (this.canvas.getBoundingClientRect().top -
            document.documentElement.getBoundingClientRect().top)
      );
      this.ctx.stroke();
      this.saveCanvasState();
    }
  }

  drawend(event: any) {
    if (this.isIdle) return;

    if (this.currentTool === 'select') {
      this.endSelection();
    } else {
      this.drawmove(event);
      this.isIdle = true;
    }
  }
  touchstart(event: any) {
    this.drawstart(event.touches[0]);
  }
  touchmove(event: any) {
    this.drawmove(event.touches[0]);
    event.preventDefault();
  }
  touchend(event: any) {
    this.drawend(event.changedTouches[0]);
  }
  pageRendered(e: any) {
    this.canvas.width = e.source.width;
    this.canvas.height = e.source.height;
    this.canvas.style.width = e.source.width + 'px';
    this.canvas.style.height = e.source.height + 'px';
  }

  disableEraser() {
    if (this.currentTool != 'eraser')
      this.ctx.globalCompositeOperation = 'source-over';
  }

  enableEraser() {
    if (this.currentTool == 'eraser')
      this.ctx.globalCompositeOperation = 'destination-out';
  }

  setBrushSize(size: any) {
    this.brushSize = size;
    this.ctx.lineWidth = this.brushSize;
  }

  setColor(color: any) {
    this.selectedColor = color;
    this.ctx.strokeStyle = this.selectedColor;
  }
  private startSelection(event: any) {
    if (this.selection !== undefined) {
      this.selection.parentNode.removeChild(this.selection);
      this.selection = undefined;
    }

    this.isSelecting = true;

    this.startX = event.offsetX;
    this.startY = event.offsetY;

    this.selection = document.createElement('div');
    this.selection.style.border = '1px dashed #000';
    this.selection.style.pointerEvents = 'none';
    this.selection.style.TouchAction = 'none';
    this.selection.style.position = 'absolute';
    this.selection.style.left = this.startX + 'px';
    this.selection.style.top = this.startY + 'px';

    document.body.appendChild(this.selection);
  }

  private updateSelection(event: any) {
    console.log('this.isSelecting', this.isSelecting);
    if (!this.isSelecting) return;

    const currentX = event.offsetX;
    const currentY = event.offsetY;

    const width = currentX - this.startX;
    const height = currentY - this.startY;

    this.selection.style.width = Math.abs(width) + 'px';
    this.selection.style.height = Math.abs(height) + 'px';
    this.selection.style.left =
      width < 0
        ? currentX +
          (this.canvas.getBoundingClientRect().left -
            document.documentElement.getBoundingClientRect().left) +
          'px'
        : this.startX +
          (this.canvas.getBoundingClientRect().left -
            document.documentElement.getBoundingClientRect().left) +
          'px';
    this.selection.style.top =
      height < 0
        ? currentY +
          (this.canvas.getBoundingClientRect().top -
            document.documentElement.getBoundingClientRect().top) +
          'px'
        : this.startY +
          (this.canvas.getBoundingClientRect().top -
            document.documentElement.getBoundingClientRect().top) +
          'px';
  }

  private endSelection() {
    if (this.isSelecting) {
      this.isSelecting = false;
      // this.selection.parentNode.removeChild(this.selection);
      // this.selection = undefined;
      // Ajoutez ici le code pour traiter la zone sélectionnée
      // Par exemple, récupérez les objets inclus dans la zone avec this.canvas.getObjects()
      // et effectuez les actions nécessaires.
    }
    console.log('endSelection', this.isSelecting);
    this.isIdle = true;
  }
}
