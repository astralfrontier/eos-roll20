on('change:brawn', (event) => {
  const brawn = parseInt(event.newValue || '0')
  const O: AttributeBundle = {}
  O['toughness'] = `${20 - brawn}`
  setAttrs(O)
})
