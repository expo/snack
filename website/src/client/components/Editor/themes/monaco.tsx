import * as darkColors from './colors-dark';
import * as lightColors from './colors-light';

const c = (color: string) => color.substr(1);

const theme = (
  { ui, syntax }: { ui: lightColors.UIColors; syntax: lightColors.SyntaxColors },
  base: 'vs' | 'vs-dark'
) => ({
  base,
  inherit: true,
  rules: [
    { token: '', foreground: c(syntax.text) },
    { token: 'invalid', foreground: c(syntax.invalid) },
    { token: 'emphasis', fontStyle: 'italic' },
    { token: 'strong', fontStyle: 'bold' },

    { token: 'variable', foreground: c(syntax.variable) },
    { token: 'variable.predefined', foreground: c(syntax.variable) },
    { token: 'constant', foreground: c(syntax.constant) },
    { token: 'comment', foreground: c(syntax.comment), fontStyle: 'italic' },
    { token: 'number', foreground: c(syntax.number) },
    { token: 'number.hex', foreground: c(syntax.number) },
    { token: 'regexp', foreground: c(syntax.regexp) },
    { token: 'annotation', foreground: c(syntax.annotation) },
    { token: 'type', foreground: c(syntax.annotation) },

    { token: 'delimiter', foreground: c(syntax.text) },
    { token: 'delimiter.html', foreground: c(syntax.text) },
    { token: 'delimiter.xml', foreground: c(syntax.text) },

    { token: 'tag', foreground: c(syntax.tag) },
    { token: 'tag.id.jade', foreground: c(syntax.tag) },
    { token: 'tag.class.jade', foreground: c(syntax.tag) },
    { token: 'meta.scss', foreground: c(syntax.tag) },
    { token: 'metatag', foreground: c(syntax.tag) },
    { token: 'metatag.content.html', foreground: c(syntax.string) },
    { token: 'metatag.html', foreground: c(syntax.tag) },
    { token: 'metatag.xml', foreground: c(syntax.tag) },
    { token: 'metatag.php', fontStyle: 'bold' },

    { token: 'key', foreground: c(syntax.property) },
    { token: 'string.key.json', foreground: c(syntax.property) },
    { token: 'string.value.json', foreground: c(syntax.string) },

    { token: 'attribute.name', foreground: c(syntax.constant) },
    { token: 'attribute.value', foreground: c(syntax.property) },
    { token: 'attribute.value.number', foreground: c(syntax.number) },
    { token: 'attribute.value.unit', foreground: c(syntax.string) },
    { token: 'attribute.value.html', foreground: c(syntax.string) },
    { token: 'attribute.value.xml', foreground: c(syntax.string) },

    { token: 'string', foreground: c(syntax.string) },
    { token: 'string.html', foreground: c(syntax.string) },
    { token: 'string.sql', foreground: c(syntax.string) },
    { token: 'string.yaml', foreground: c(syntax.string) },

    { token: 'keyword', foreground: c(syntax.keyword) },
    { token: 'keyword.json', foreground: c(syntax.keyword) },
    { token: 'keyword.flow', foreground: c(syntax.keyword) },
    { token: 'keyword.flow.scss', foreground: c(syntax.keyword) },

    { token: 'operator.scss', foreground: c(syntax.operator) },
    { token: 'operator.sql', foreground: c(syntax.operator) },
    { token: 'operator.swift', foreground: c(syntax.operator) },
    { token: 'predefined.sql', foreground: c(syntax.predefined) },
  ],
  colors: {
    'editor.background': ui.background,
    'editor.foreground': ui.text,
    'editorIndentGuide.background': ui.indent.inactive,
    'editorIndentGuide.activeBackground': ui.indent.active,
    'editorOverviewRuler.border': ui.background,
  },
});

export const light = theme(lightColors, 'vs');
export const dark = theme(darkColors, 'vs-dark');
