// Debug helpers
// =============
function assert(condition: any, message = "No message provided") {
    if (!condition) {
        throw new Error("Assertion error: " + message);
    }
}


// Component interfaces
// ====================

/** Tree node with children */
interface ITreeNodeParent<TChild extends ITreeNodeChild<ITreeNodeParent<TChild>>> {
    first: TChild;
    last: TChild;
}
type ITreeNodeParentAny = ITreeNodeParent<any>;

/** Tree node with siblings */
interface ITreeNodeSibling<TSibling extends ITreeNodeSibling<TSibling>> {
    nextSibling: TSibling;
    prevSibling: TSibling;
}
type ITreeNodeSiblingAny = ITreeNodeSibling<any>;

/** Tree node with a parent */
interface ITreeNodeChild<TParent extends ITreeNodeParent<ITreeNodeChild<TParent>>> {
    parent: TParent;
}
type ITreeNodeChildAny = ITreeNodeChild<any>;

/** Convenience typing combining ITreeNodeChild and ITreeNodeSibling */
interface ITreeNodeChildSibling<
    TParent extends ITreeNodeParent<ITreeNodeChild<TParent>>,
    TSibling extends ITreeNodeSibling<TSibling>
> extends ITreeNodeChild<TParent>, ITreeNodeSibling<TSibling> { }
type ITreeNodeChildSiblingAny = ITreeNodeChildSibling<any, any>;


// Node interfaces and constructors
// ================================

/** An ordinary tree node with a parent and children */
interface ITreeNode<
    TParent extends ITreeNodeParent<ITreeNodeChild<TParent>>,
    TChild extends ITreeNodeChild<ITreeNodeParent<TChild>>,
    TSibling extends ITreeNodeSibling<TSibling>,
> extends ITreeNodeParent<TChild>, ITreeNodeSibling<TSibling>, ITreeNodeChild<TParent> { }
type ITreeNodeAny = ITreeNode<any, any, any>;

/** Creates and returns an unconnected ordinary tree node */
function createNode<
    TParent extends ITreeNodeParent<ITreeNodeChild<TParent>>,
    TChild extends ITreeNodeChild<ITreeNodeParent<TChild>>,
    TSibling extends ITreeNodeSibling<TSibling>
>(): ITreeNode<TParent, TChild, TSibling> {
    return {
        parent: null,
        first: null,
        last: null,
        nextSibling: null,
        prevSibling: null,
    };
}

type IRootNode<TChild extends ITreeNodeChild<ITreeNodeParent<TChild>>> = ITreeNodeParent<TChild>;
function createRoot<
    TChild extends ITreeNodeChild<ITreeNodeParent<TChild>>
>(): IRootNode<TChild> {
    return {
        first: null,
        last: null,
    };
}

type ILeafNode<
    TParent extends ITreeNodeParent<ITreeNodeChild<TParent>>,
    TSibling extends ITreeNodeSibling<TSibling>
> = ITreeNodeChildSibling<TParent, TSibling>;
function createLeaf<
    TParent extends ITreeNodeParent<ITreeNodeChild<TParent>>,
    TSibling extends ITreeNodeSibling<TSibling>
>(): ILeafNode<TParent, TSibling> {
    return {
        parent: null,
        nextSibling: null,
        prevSibling: null,
    };
}

// LinkedList helper function implementations
// ==========================================

/** Returns true if root has children */
function isParent(node: ITreeNodeParentAny) {
    assert(isValidParent(node), "cannot check if node is parent: node is invalid");
    return !!node.first;
}

/** Returns true if root has a parent */
function isChild(node: ITreeNodeChildAny) {
    return !!node.parent;
}

/** Returns true if node does not have a parent. */
function isRoot(node: ITreeNodeChildAny) {
    return !node.parent;
}

/**
 * Returns true if this node is a valid parent
 * This does not imply the node actually parents any children
 */
function isValidParent(node: ITreeNodeParentAny) {
    return !!node.first === !!node.last;
}

/** 
 * Returns true if child/sibling props are valid.
 * This does not imply that the node has a parent.
 * - Always valid if it has a parent
 * - Otherwise, invalid if it has either nextSibling or prevSibling 
 */
function isValidChild(node: ITreeNodeChildSiblingAny) {
    return !!node.parent || !(node.nextSibling || node.prevSibling);
}

/**
 * Returns true if node is valid
 * A node with a first child but not a last child is invalid.
 * A node with a prev or next sibling but no parent is invalid.
 */
function isValidNode(node: ITreeNodeAny) {
    return isValidParent(node) && isValidChild(node);
}


// LinkedList modification operation implementations
// ======================

function addFirst<
    TParent extends ITreeNodeParent<TNode>,
    TNode extends ITreeNodeChildSibling<TParent, TNode>
>(parent: TParent, node: TNode) {

    assert(isValidChild(node), "cannot add node because it is invalid");
    assert(isValidParent(parent), "cannot add to parent because it is invalid");
    assert(isRoot(node), "expect node to add not currently parented");

    // sibling relationship
    const first = parent.first;
    if (first) {
        node.nextSibling = first;
        first.prevSibling = node;
    }

    // parent-child relationship
    node.parent = parent;
    parent.first = node;
    if (parent.last == null) {
        parent.last = node;
    }

    return node;
}

function addLast<
    TParet extends ITreeNodeParent<TNode>,
    TNode extends ITreeNodeChildSibling<TParet, TNode>
>(parent: TParet, node: TNode) {

    assert(isValidChild(node), "cannot add node because it is invalid");
    assert(isValidParent(parent), "cannot add to parent because it is invalid");
    assert(isRoot(node), "expect node to add not currently parented");

    // sibling relationship
    const last = parent.last;
    if (last) {
        node.prevSibling = last;
        last.nextSibling = node;
    }

    // parent-child relationship
    node.parent = parent;
    parent.last = node;
    if (parent.first == null) {
        parent.first = node;
    }

    return node;
}

function addAfter<
    TParent extends ITreeNodeParent<ITreeNodeChild<TParent>>,
    TSibling extends ITreeNodeChildSibling<TParent, TSibling>
>(existingNode: TSibling, nodeToAdd: TSibling) {

    const parent = existingNode.parent,
        last = parent.last === existingNode;

    assert(isValidChild(nodeToAdd), "cannot add node because it is invalid");
    assert(isValidParent(parent), "cannot add to parent because it is invalid");
    assert(isChild(existingNode), "cannot add node as a sibling to a root");
    assert(isRoot(nodeToAdd), "expect node to add not currently parented");

    // sibling relationship
    if (!last) {
        nodeToAdd.nextSibling = existingNode.nextSibling;
        nodeToAdd.nextSibling.prevSibling = nodeToAdd;
    }
    nodeToAdd.prevSibling = existingNode;
    existingNode.nextSibling = nodeToAdd;

    // parent-child relationship
    nodeToAdd.parent = parent;
    if (last) {
        parent.last = nodeToAdd;
    }

    return nodeToAdd;
}

function addBefore<
    TParent extends ITreeNodeParent<ITreeNodeChild<TParent>>,
    TSibling extends ITreeNodeChildSibling<TParent, TSibling>
>(existingNode: TSibling, nodeToAdd: TSibling) {

    const parent = existingNode.parent,
        first = parent.first === existingNode;

    assert(isValidChild(nodeToAdd), "cannot add node because it is invalid");
    assert(isValidParent(parent), "cannot add to parent because it is invalid");
    assert(isChild(existingNode), "cannot add node as a sibling to a root");
    assert(isRoot(nodeToAdd), "expect node to add not currently parented");

    // sibling relationship
    if (!first) {
        nodeToAdd.prevSibling = existingNode.prevSibling;
        nodeToAdd.prevSibling.nextSibling = nodeToAdd;
    }
    nodeToAdd.nextSibling = existingNode;
    existingNode.prevSibling = nodeToAdd;

    // parent-child relationship
    nodeToAdd.parent = parent;
    if (first) {
        parent.first = nodeToAdd;
    }

    return nodeToAdd;
}

// TODO remove methods


// Some test cases
// ===============

// possible scenarios:
// 1. a simple tree whose nodes are all of the same type
// 2. a slightly more complex but still simple tree where all nodes who are siblings are the same type
//      which implies that all nodes with the same depth are the same type
//      because nodes of the same type, by definition, have the same types of children.
// 3. a complex tree where nodes on a single level are heterogeneous
// 4. 


// Scenario 1
// ----------
// a simple tree whose nodes are all of the same type
interface ISimpleNode extends ITreeNode<ISimpleNode, ISimpleNode, ISimpleNode> {
    i: number;
}
const createSimpleNodeBlank = () => createNode<ISimpleNode, ISimpleNode, ISimpleNode>();
const createSimpleNode = (i: number) => {
    const node = createSimpleNodeBlank() as ISimpleNode;
    node.i = i;
    return node;
};

(function() {
    const root = createSimpleNode(0),
        node1 = addLast(root, createSimpleNode(1)),
        node2 = addLast(root, createSimpleNode(2)),
        node3 = addLast(root, createSimpleNode(3));
    addLast(node1, createSimpleNode(11));
    addLast(node1, createSimpleNode(12));
    addLast(node1, createSimpleNode(13));
    addLast(node2, createSimpleNode(21));
    addLast(node2, createSimpleNode(22));
    addLast(node2, createSimpleNode(23));
    addLast(node3, createSimpleNode(31));
    addLast(node3, createSimpleNode(32));
    addLast(node3, createSimpleNode(33));
    let node: ISimpleNode = root;
    while (node != null) {
        // tslint:disable-next-line
        console.log(node.i);

        // the next node is this node's first child
        if (node.first) {
            node = node.first;
            continue;
        }

        // if this node has no children, we return our next
        // if we don't have a next, our parent's next, etc.
        let parent: ISimpleNode = node;
        while (parent && !parent.nextSibling) {
            parent = parent.parent;
        }
        node = parent && parent.nextSibling;
    }
}());


// Scenario 2
// ----------
// a simple tree where all nodes who are siblings are the same type
//  (all nodes with same depth are same type)
// as a bonus, we show making these ones out of classes
interface IWalkable {
    print(): void;
    getNextNode(): IWalkable;
    getNextSibling(): IWalkable;
}

class TypeA implements IRootNode<TypeB>, IWalkable {
    constructor(
        public asdf: number,
        public first: TypeB = null,
        public last: TypeB = null
    ) { }

    public print() {
        // tslint:disable-next-line
        console.log(this.asdf);
    }

    public getNextNode() {
        return this.first;
    }

    public getNextSibling(): IWalkable {
        return null;
    }

    public addFirst(node: TypeB) {
        return addFirst(this as TypeA, node);
    }

    public addLast(node: TypeB) {
        return addLast(this as TypeA, node);
    }
}

class TypeB implements ITreeNode<TypeA, TypeC, TypeB>, IWalkable {
    constructor(
        public blargh: string,
        public parent: TypeA = null,
        public nextSibling: TypeB = null,
        public prevSibling: TypeB = null,
        public first: TypeC = null,
        public last: TypeC = null
    ) { }

    public print() {
        // tslint:disable-next-line
        console.log(this.blargh);
    }

    public getNextNode(): IWalkable {
        return this.first || this.getNextSibling();
    }

    public getNextSibling(): IWalkable {
        return this.nextSibling || this.parent.getNextSibling();
    }

    public addFirst(node: TypeC) {
        return addFirst(this as TypeB, node);
    }

    public addLast(node: TypeC) {
        return addLast(this as TypeB, node);
    }

    public addNodeAfter(node: TypeB) {
        return addAfter(this, node);
    }

    public addNodeBefore(node: TypeB) {
        return addBefore(this, node);
    }

    public addAfter(node: TypeB) {
        return addAfter(node, this);
    }

    public addBefore(node: TypeB) {
        return addBefore(node, this);
    }

    public addToEndOf(parent: TypeA) {
        return addLast(parent, this as TypeB);
    }

    public addToFrontOf(parent: TypeA) {
        return addFirst(parent, this as TypeB);
    }
}

class TypeC implements ILeafNode<TypeB, TypeC>, IWalkable {
    constructor(
        public qwer: number,
        public parent: TypeB = null,
        public nextSibling: TypeC = null,
        public prevSibling: TypeC = null
    ) { }

    public print() {
        // tslint:disable-next-line
        console.log(this.qwer);
    }

    public getNextNode(): IWalkable {
        return this.getNextSibling() || this.parent.getNextSibling();
    }

    public getNextSibling() {
        return this.nextSibling;
    }

    public addNodeAfter(node: TypeC) {
        return addAfter(this, node);
    }

    public addNodeBefore(node: TypeC) {
        return addBefore(this, node);
    }

    public addAfter(node: TypeC) {
        return addAfter(node, this);
    }

    public addBefore(node: TypeC) {
        return addBefore(node, this);
    }

    public addToEndOf(parent: TypeB) {
        return addLast(parent, this as TypeC);
    }

    public addToFrontOf(parent: TypeB) {
        return addFirst(parent, this as TypeC);
    }
}

(function() {
    const root = new TypeA(0),
        node1 = root.addFirst(new TypeB("Hello")),
        node3 = node1.addNodeAfter(new TypeB("Colorado")),
        node2 = new TypeB("World").addBefore(node3),
        node11 = new TypeC(11).addToEndOf(node1),
        node21 = node2.addLast(new TypeC(21)),
        node33 = node3.addLast(new TypeC(33));
    new TypeC(12).addAfter(node11).addNodeBefore(new TypeC(13));
    node21.addNodeAfter(new TypeC(22)).addNodeAfter(new TypeC(23));
    new TypeC(31).addBefore(new TypeC(32).addBefore(node33));

    let node: IWalkable = root;
    while (node != null) {
        node.print();
        node = node.getNextNode();
    }
}());

// Scenario 3
// ----------
// a simple tree where in one level, siblings have a common type,
// but are distinct.  Specifically test addAfter/addBefore in this case
