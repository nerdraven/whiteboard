class Box {
  constructor(
    public readonly posX: number,
    public readonly posY: number,
    public readonly width: number,
    public readonly height: number,
    public readonly color: string
  ) {}
}

class ImageItem {
  constructor(public readonly image: HTMLImageElement) {}
}

type Item = Box | ImageItem;

function isBox(item: Box | ImageItem): item is Box {
  return (<Box>item).posX !== undefined;
}

function* getRandomColor(): Generator<string, string, string> {
  let currentNumber = 0;
  const googColors = ["blue", "red", "yellow", "green"];
  while (true) {
    currentNumber++;
    yield googColors[currentNumber % googColors.length];
  }
}

class Canvas {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;

  private readonly boxes: Array<Item> = [];
  private currentBox: Item | undefined = undefined;

  private xstartPosition: number = 0;
  private ystartPosition: number = 0;

  private canDraw: boolean = false;
  private currentColor: string | undefined = undefined;
  private colorGenerator: Generator<string, string, string> = getRandomColor();

  private saveCallbacks: Array<(box: Box) => boolean> = [];

  constructor(element: HTMLCanvasElement, width: number, height: number) {
    this.canvas = element;
    this.ctx = element.getContext("2d")!;
    this.setupSize(width, height);
  }

  public setPicture(path: string): void {
    const image = new Image(10, 10);
    image.src = path;
    this.boxes.push(new ImageItem(image));
    image.onload = () => {
      this.refresh();
    };
  }

  private setupSize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  public setup() {
    this.canvas.addEventListener("mouseup", (e) => this.onMouseUp(e));
    this.canvas.addEventListener("mousedown", (e) => this.onMouseDown(e));
    this.canvas.addEventListener("mousemove", (e) => this.onDraw(e));
    console.log("Mounted canvas");
    this.setupPen();
  }

  public setColor(color: string): void {
    this.ctx.strokeStyle = color;
    this.currentColor = color;
  }

  private setupPen() {
    this.ctx.lineCap = "butt";
    this.ctx.lineWidth = 3;
  }

  private get xCorrection(): number {
    return this.canvas.getBoundingClientRect().left;
  }

  private get yCorrection(): number {
    return this.canvas.getBoundingClientRect().top;
  }

  private saveCurrentBox(): void {
    for (const callback of this.saveCallbacks) {
      try {
        const res = callback(<Box>this.currentBox);
        if(!res) return;
      } catch (error) {
        console.log(error);
        return;
      }
    }
    if (typeof this.currentBox !== "undefined") {
      this.boxes.push(this.currentBox);
      this.currentBox = undefined;
    }
  }

  public addSaveListener(callback: (box: Box) => boolean): void {
    this.saveCallbacks.push(callback);
  }

  private onMouseUp(e: MouseEvent): void {
    this.canDraw = false;
    this.xstartPosition = Infinity;
    this.ystartPosition = Infinity;
    this.saveCurrentBox();
    this.currentColor = undefined;
  }

  private onMouseDown(e: MouseEvent): void {
    this.canDraw = true;
    this.xstartPosition = e.clientX - this.xCorrection;
    this.ystartPosition = e.clientY - this.yCorrection;
  }

  private refresh(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const box of this.boxes) {
      if (isBox(box)) {
        const previousColor = this.currentColor!;
        this.setColor(box.color);
        this.ctx.strokeRect(box.posX, box.posY, box.width, box.height);
        this.setColor(previousColor);
      } else {
        this.ctx.drawImage(
          box.image,
          0,
          0,
          this.canvas.width,
          this.canvas.height
        );
      }
    }
  }

  private onDraw(e: MouseEvent): void {
    this.drawRectangle(e);
  }

  private drawRectangle(e: MouseEvent): void {
    if (!this.canDraw) return;
    this.refresh();

    if (typeof this.currentColor === "undefined") {
      this.setColor(this.colorGenerator.next().value);
    }

    const width = e.clientX - this.xstartPosition - this.xCorrection;
    const height = e.clientY - this.ystartPosition - this.yCorrection;

    this.ctx.strokeRect(
      this.xstartPosition,
      this.ystartPosition,
      width,
      height
    );

    this.currentBox = new Box(
      this.xstartPosition,
      this.ystartPosition,
      width,
      height,
      this.currentColor!
    );
  }
}

function Main(): void {
  const width = window.innerWidth - 9;
  const height = window.innerHeight - 9;

  const container: HTMLDivElement = document.createElement("div");
  const canvas: HTMLCanvasElement = document.createElement("canvas");
  container.appendChild(canvas);

  canvas.id = "canvas";
  container.style.position = "relative";
  canvas.style.position = "absolute";

  document.body.appendChild(container);

  window.canvas = new Canvas(canvas, width, height);
  window.canvas.setup();
  window.canvas.setPicture("./static/picture.jpg");
  window.canvas.addSaveListener((box) => {
    const width = box.posX + Math.ceil(box.width / 2);
    const height = box.posY + Math.ceil(box.height / 2);
    addOverlay(width, height, box.color, container);
    return true;
  })
}

function addOverlay(posX: number, posY: number, color: string, container: HTMLDivElement): void {
  const overlay = document.createElement("div");
  overlay.style.position = "absolute";
  overlay.className = "overlay";
  overlay.style.top = `${posY - 50}px`
  overlay.style.left = `${posX - 50}px`;
  overlay.style.width = "100px";
  overlay.style.height = "100px";
  overlay.style.backgroundColor = color;
  container.appendChild(overlay);
}

window.addEventListener("load", Main);
