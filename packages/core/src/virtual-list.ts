export interface VirtualListOptions<T> {
  container: HTMLElement;
  items: T[];
  itemHeight: number;
  buffer?: number;
  renderItem: (item: T, index: number) => HTMLElement;
}

export class VirtualList<T> {
  private container: HTMLElement;
  private items: T[];
  private itemHeight: number;
  private buffer: number;
  private renderItem: (item: T, index: number) => HTMLElement;

  private spacer: HTMLDivElement;
  private wrapper: HTMLDivElement;
  private scrollListener: () => void;
  private resizeObserver?: ResizeObserver;

  constructor(options: VirtualListOptions<T>) {
    this.container = options.container;
    this.items = options.items;
    this.itemHeight = options.itemHeight;
    this.buffer = options.buffer ?? 8;
    this.renderItem = options.renderItem;

    this.container.style.position = 'relative';
    this.container.style.overflowY = 'auto';

    this.spacer = document.createElement('div');
    this.spacer.style.position = 'absolute';
    this.spacer.style.top = '0';
    this.spacer.style.left = '0';
    this.spacer.style.width = '1px';

    this.wrapper = document.createElement('div');
    this.wrapper.style.position = 'absolute';
    this.wrapper.style.top = '0';
    this.wrapper.style.left = '0';
    this.wrapper.style.right = '0';

    this.container.appendChild(this.spacer);
    this.container.appendChild(this.wrapper);

    this.scrollListener = () => this.render();
    this.container.addEventListener('scroll', this.scrollListener);

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.render());
      this.resizeObserver.observe(this.container);
    }

    this.updateItems(options.items);
  }

  public updateItems(newItems: T[]) {
    this.items = newItems;
    this.spacer.style.height = `${newItems.length * this.itemHeight}px`;
    this.render();
  }

  public render() {
    const totalCount = this.items.length;
    if (totalCount === 0) {
      this.wrapper.innerHTML = '';
      this.spacer.style.height = '0px';
      return;
    }

    const scrollTop = this.container.scrollTop;
    const containerHeight = this.container.clientHeight || 450;

    const startIndex = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.buffer);
    const endIndex = Math.min(totalCount - 1, Math.floor((scrollTop + containerHeight) / this.itemHeight) + this.buffer);

    this.wrapper.style.transform = `translateY(${startIndex * this.itemHeight}px)`;
    this.wrapper.innerHTML = '';

    const fragment = document.createDocumentFragment();
    for (let i = startIndex; i <= endIndex; i++) {
      const item = this.items[i];
      if (item !== undefined) {
        const itemEl = this.renderItem(item, i);
        itemEl.style.height = `${this.itemHeight}px`;
        itemEl.style.boxSizing = 'border-box';
        itemEl.style.overflow = 'hidden';
        itemEl.style.textOverflow = 'ellipsis';
        itemEl.style.whiteSpace = 'nowrap';
        fragment.appendChild(itemEl);
      }
    }
    this.wrapper.appendChild(fragment);
  }

  public destroy() {
    this.container.removeEventListener('scroll', this.scrollListener);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    this.container.innerHTML = '';
  }

  public scrollToBottom() {
    this.container.scrollTop = this.container.scrollHeight;
  }
}
