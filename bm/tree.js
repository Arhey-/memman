/**
 * Created by Arhey on 12.10.2014.
 */
;(function () {
    var tree;

    tree = document.getElementById('tree');

    function generateList(array, ul) {
        array.forEach(function (val) {
            var li;

            li = document.createElement('li');
            li.textContent = val;
            ul.appendChild(li);
        });
    }

    generateList(tagList.all, tree);

    tree.addEventListener('click', function (e) {
        var path,
            pathArray,
            li,
            ul,
            list,
            active;

        li = e.target;
        pathArray = [li.firstChild.textContent];

        ul = li.parentElement;
        while (ul != tree) {
            ul = ul.parentElement; // get parent 'li'
            pathArray.push(ul.firstChild.textContent);
            ul = ul.parentElement;
        }
        path = '.' + pathArray.join('.');

        if (!e.altKey) {
            if (e.ctrlKey) {
                cmd.value += ', ' + path;
            } else {
                cmd.value = path;
            }
            applyFilter();
        }

        if (li.childElementCount) {
            if (e.altKey) {
                li.classList.toggle('fold');
            }
        } else {
            list = indexation(path); // fixme twice call

            // todo like php list()
            list = list.filter(function (val) {
                return !~pathArray.indexOf(val);
            });
            // ---

            if (!list.length) {
                return;
            }
            
            if (active = tree.getElementsByClassName('active')[0]) {
                active.classList.remove('active');
            }
            li.classList.add('active');
            
            ul = document.createElement('ul');
            generateList(list, ul);
            li.appendChild(ul);
        }
    }, false);
})();
