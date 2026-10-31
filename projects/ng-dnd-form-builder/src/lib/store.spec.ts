import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { createDocument } from './document';
import { BuilderStore } from './store';

describe('BuilderStore', () => {
  let store: BuilderStore;
  const textType = () => store.config.definitions[0];

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [BuilderStore] });
    store = TestBed.inject(BuilderStore);
  });

  it('undoes and redoes one step at a time', () => {
    store.addAfterSelection(textType());
    store.addAfterSelection(textType());
    expect(store.doc().fieldGroup.length).toBe(2);
    store.undo();
    expect(store.doc().fieldGroup.length).toBe(1);
    store.redo();
    expect(store.doc().fieldGroup.length).toBe(2);
  });

  it('keeps 50 steps of history', () => {
    for (let i = 0; i < 60; i++) store.addAfterSelection(textType());
    let undos = 0;
    while (store.canUndo()) {
      store.undo();
      undos++;
    }
    expect(undos).toBe(50);
    expect(store.doc().fieldGroup.length).toBe(10);
  });

  it('a new edit clears redo', () => {
    store.addAfterSelection(textType());
    store.undo();
    store.addAfterSelection(textType());
    expect(store.canRedo()).toBe(false);
  });

  it('an edit that changes nothing adds no history', () => {
    store.addAfterSelection(textType());
    const id = store.doc().fieldGroup[0].id!;
    store.undo();
    store.move(id, null, 0);
    expect(store.canUndo()).toBe(false);
  });

  it('adds next to the selection, or inside a selected group', () => {
    store.addAfterSelection(textType());
    const first = store.selectedId();
    store.addAfterSelection(textType());
    const last = store.selectedId();
    store.selectedId.set(first);
    store.addAfterSelection(textType());
    expect(store.doc().fieldGroup[2].id).toBe(last);

    const group = store.config.definitions.find((d) => d.type === 'group')!;
    store.addAfterSelection(group);
    store.addAfterSelection(textType());
    const added = store.doc().fieldGroup.find((f) => f.fieldGroup)!;
    expect(added.fieldGroup!.length).toBe(1);
  });

  it('loading a document resets history', () => {
    store.addAfterSelection(textType());
    store.load(createDocument());
    expect(store.canUndo()).toBe(false);
    expect(store.selectedId()).toBeNull();
  });
});
