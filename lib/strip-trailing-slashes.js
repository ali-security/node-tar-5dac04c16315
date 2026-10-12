// strip any trailing / chars from a path.
// done with a simple scan from the end, rather than str.replace(/\/+$/, ''),
// because that regular expression backtracks badly (polynomial time) on
// long runs of / chars that are not at the end of the string.
module.exports = str => {
  let i = str.length - 1
  let slashesStart = -1
  while (i > -1 && str.charAt(i) === '/') {
    slashesStart = i
    i--
  }
  return slashesStart === -1 ? str : str.slice(0, slashesStart)
}
