/**
 * Created by Arhey on 17.08.14.
 */
function doSelect(target, start, end, e) {
    setTimeout(function () { // fixme delete timeout wrapper
        target.setSelectionRange(start, end);
    }, 0);
}
