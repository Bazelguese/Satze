import { uuid, getStyleProperties } from './util';
function formatCSSText(style) {
    const content = style.getPropertyValue('content');
    return `${style.cssText} content: '${content.replace(/'|"/g, '')}';`;
}
function formatCSSProperties(style, options, nativeNode, pseudo) {
    return getStyleProperties(options)
        .map((name) => {
        const value = style.getPropertyValue(name);
        // SATZE: proprietà che lo pseudo-elemento clonato avrebbe comunque uguale (vedi README)
        if (options.omitPseudoStyle && options.omitPseudoStyle(nativeNode, pseudo, name, value)) {
            return '';
        }
        const priority = style.getPropertyPriority(name);
        return `${name}: ${value}${priority ? ' !important' : ''};`;
    })
        .filter(Boolean)
        .join(' ');
}
function getPseudoElementStyle(className, pseudo, style, options, nativeNode) {
    const selector = `.${className}:${pseudo}`;
    const cssText = style.cssText
        ? formatCSSText(style)
        : formatCSSProperties(style, options, nativeNode, pseudo);
    return document.createTextNode(`${selector}{${cssText}}`);
}
function clonePseudoElement(nativeNode, clonedNode, pseudo, options) {
    const style = window.getComputedStyle(nativeNode, pseudo);
    const content = style.getPropertyValue('content');
    if (content === '' || content === 'none') {
        return;
    }
    const className = uuid();
    try {
        clonedNode.className = `${clonedNode.className} ${className}`;
    }
    catch (err) {
        return;
    }
    const styleElement = document.createElement('style');
    styleElement.appendChild(getPseudoElementStyle(className, pseudo, style, options, nativeNode));
    clonedNode.appendChild(styleElement);
}
export function clonePseudoElements(nativeNode, clonedNode, options) {
    clonePseudoElement(nativeNode, clonedNode, ':before', options);
    clonePseudoElement(nativeNode, clonedNode, ':after', options);
}
