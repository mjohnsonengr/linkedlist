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

type IRootNode<TChild extends ITreeNodeChild<ITreeNodeParent<TChild>>> = ITreeNode<any, TChild, any>;
function createRoot<TChild extends ITreeNodeChild<ITreeNodeParent<TChild>>>() {
    return createNode<any, TChild, any>();
}

type ILeafNode<
    TParent extends ITreeNodeParent<ITreeNodeChild<TParent>>,
    TSibling extends ITreeNodeSibling<TSibling>
> = ITreeNode<TParent, any, TSibling>;
function createLeaf<
    TParent extends ITreeNodeParent<ITreeNodeChild<TParent>>,
    TSibling extends ITreeNodeSibling<TSibling>
>() {
    return createNode<TParent, any, TSibling>();
}

// LinkedList helper function implementations
// ==========================================

/** Returns true if root has children */
function isParent(parentNode: ITreeNodeParentAny) {
    assert(isValidParent(parentNode), "cannot check if node is parent: node is invalid");
    return !!parentNode.first;
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

// TODO addAfter(existingNode, nodeToAdd)
// TODO addBefore(existingNode, nodeToAdd)
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
    let i = 0;
    const root = createSimpleNode(0);
    const node1 = addLast(root, createSimpleNode(1));
    const node2 = addLast(root, createSimpleNode(2));
    const node3 = addLast(root, createSimpleNode(3));
    /*const leaf11 = */addLast(node1, createSimpleNode(11));
    /*const leaf12 = */addLast(node1, createSimpleNode(12));
    /*const leaf13 = */addLast(node1, createSimpleNode(13));
    /*const leaf21 = */addLast(node2, createSimpleNode(21));
    /*const leaf22 = */addLast(node2, createSimpleNode(22));
    /*const leaf23 = */addLast(node2, createSimpleNode(23));
    /*const leaf31 = */addLast(node3, createSimpleNode(31));
    /*const leaf32 = */addLast(node3, createSimpleNode(32));
    /*const leaf33 = */addLast(node3, createSimpleNode(33));
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
// a simple tree where all nodes who are siblings are the same time
//  (all nodes with same depth are same type)
// interface TypeA extends IRootNode<TypeB> { }
// const createTypeA = () => createRoot<TypeB>();

// interface TypeB extends ITreeNode<TypeA, TypeC, TypeB> { }
// const createTypeB = () => createNode<TypeA, TypeC, TypeB>();

// interface TypeC extends ILeafNode<TypeB, TypeC> { }
// const createTypeC = () => createLeaf<TypeB, TypeC>();
