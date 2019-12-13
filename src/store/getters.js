/**
 *  @namespace getter
 *  @desc get state
 *  @example in components
 *
 *  computed: mapGetters([
 *    'isLoading'
 *  ]),
 */
export const isLoading = state => {
  return state.isLoading
}
