
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.42.1' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/App.svelte generated by Svelte v3.42.1 */

    const { console: console_1, document: document_1 } = globals;
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let link;
    	let script;
    	let script_src_value;
    	let t0;
    	let nav;
    	let img0;
    	let img0_src_value;
    	let t1;
    	let button0;
    	let span0;
    	let t2;
    	let div0;
    	let ul;
    	let li;
    	let a;
    	let t4;
    	let div1;
    	let h3;
    	let t6;
    	let div2;
    	let input;
    	let t7;
    	let p;
    	let t8;
    	let button1;
    	let span1;
    	let t10;
    	let div3;
    	let button2;
    	let span2;
    	let t12;
    	let div4;
    	let canvas;
    	let t13;
    	let img1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			link = element("link");
    			script = element("script");
    			t0 = space();
    			nav = element("nav");
    			img0 = element("img");
    			t1 = space();
    			button0 = element("button");
    			span0 = element("span");
    			t2 = space();
    			div0 = element("div");
    			ul = element("ul");
    			li = element("li");
    			a = element("a");
    			a.textContent = "Donate";
    			t4 = space();
    			div1 = element("div");
    			h3 = element("h3");
    			h3.textContent = "Simply choose a PNG file, click the button and watch some magic";
    			t6 = space();
    			div2 = element("div");
    			input = element("input");
    			t7 = space();
    			p = element("p");
    			t8 = space();
    			button1 = element("button");
    			span1 = element("span");
    			span1.textContent = "Begone!";
    			t10 = space();
    			div3 = element("div");
    			button2 = element("button");
    			span2 = element("span");
    			span2.textContent = "Download!";
    			t12 = space();
    			div4 = element("div");
    			canvas = element("canvas");
    			t13 = space();
    			img1 = element("img");
    			attr_dev(link, "href", "https://fonts.googleapis.com/css2?family=Space+Grotesk&display=swap");
    			attr_dev(link, "rel", "stylesheet");
    			add_location(link, file, 49, 2, 1237);
    			script.async = true;
    			if (!src_url_equal(script.src, script_src_value = "js/opencv.js")) attr_dev(script, "src", script_src_value);
    			add_location(script, file, 53, 2, 1350);
    			set_style(img0, "cursor", "pointer");
    			if (!src_url_equal(img0.src, img0_src_value = "images/Logo.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "width", "150");
    			attr_dev(img0, "alt", "");
    			add_location(img0, file, 56, 2, 1485);
    			attr_dev(span0, "class", "navbar-toggler-icon");
    			add_location(span0, file, 72, 4, 1838);
    			attr_dev(button0, "class", "navbar-toggler");
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "data-toggle", "collapse");
    			attr_dev(button0, "data-target", "#navbarSupportedContent");
    			attr_dev(button0, "aria-controls", "navbarSupportedContent");
    			attr_dev(button0, "aria-expanded", "false");
    			attr_dev(button0, "aria-label", "Toggle navigation");
    			add_location(button0, file, 63, 2, 1604);
    			attr_dev(a, "class", "textPurple font svelte-136bf0v");
    			attr_dev(a, "href", "https://www.patreon.com/alivillegas");
    			add_location(a, file, 78, 8, 2039);
    			attr_dev(li, "class", "nav-item");
    			add_location(li, file, 77, 6, 2009);
    			attr_dev(ul, "class", "navbar-nav mx-auto my-2 p-3 ");
    			add_location(ul, file, 76, 4, 1961);
    			attr_dev(div0, "class", "collapse navbar-collapse");
    			attr_dev(div0, "id", "navbarSupportedContent");
    			add_location(div0, file, 75, 2, 1890);
    			attr_dev(nav, "class", "navbar navbar-expand-lg navbar-light borderBottomPurple mb-3 svelte-136bf0v");
    			add_location(nav, file, 55, 0, 1408);
    			add_location(h3, file, 86, 2, 2232);
    			attr_dev(div1, "class", "mx-auto d-block text-center my-5 font svelte-136bf0v");
    			add_location(div1, file, 85, 0, 2178);
    			attr_dev(input, "id", "fileInput");
    			attr_dev(input, "class", "text-center mx-auto");
    			attr_dev(input, "type", "file");
    			set_style(input, "width", "50vw");
    			set_style(input, "height", "5vw");
    			set_style(input, "min-height", "50px");
    			attr_dev(input, "name", "upfile");
    			attr_dev(input, "accept", "image/png,image/jpeg");
    			input.required = true;
    			add_location(input, file, 89, 2, 2361);
    			add_location(p, file, 99, 2, 2598);
    			set_style(span1, "margin-bottom", "10");
    			add_location(span1, file, 101, 4, 2678);
    			attr_dev(button1, "class", "begoneBtn borderPurple my-3 svelte-136bf0v");
    			add_location(button1, file, 100, 2, 2606);
    			attr_dev(div2, "class", "mx-auto d-block text-center my-3");
    			add_location(div2, file, 88, 0, 2312);
    			set_style(span2, "margin-bottom", "10");
    			add_location(span2, file, 111, 4, 2934);
    			attr_dev(button2, "class", "begoneBtn borderPurple my-5 mx-auto  svelte-136bf0v");
    			set_style(button2, "display", "none");
    			attr_dev(button2, "id", "downloadButton");
    			add_location(button2, file, 105, 2, 2796);
    			attr_dev(div3, "class", "mx-auto d-block text-center my-5");
    			add_location(div3, file, 104, 0, 2747);
    			attr_dev(canvas, "id", "outputImage");
    			attr_dev(canvas, "width", "500");
    			add_location(canvas, file, 115, 2, 3054);
    			attr_dev(img1, "id", "input_img");
    			attr_dev(img1, "width", "500");
    			attr_dev(img1, "height", "500");
    			attr_dev(img1, "alt", "");
    			set_style(img1, "display", "none");
    			add_location(img1, file, 116, 2, 3096);
    			attr_dev(div4, "class", "mx-auto d-block text-center my-3");
    			add_location(div4, file, 114, 0, 3005);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document_1.head, link);
    			append_dev(document_1.head, script);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, nav, anchor);
    			append_dev(nav, img0);
    			append_dev(nav, t1);
    			append_dev(nav, button0);
    			append_dev(button0, span0);
    			append_dev(nav, t2);
    			append_dev(nav, div0);
    			append_dev(div0, ul);
    			append_dev(ul, li);
    			append_dev(li, a);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h3);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, input);
    			append_dev(div2, t7);
    			append_dev(div2, p);
    			append_dev(div2, t8);
    			append_dev(div2, button1);
    			append_dev(button1, span1);
    			insert_dev(target, t10, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, button2);
    			append_dev(button2, span2);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, canvas);
    			append_dev(div4, t13);
    			append_dev(div4, img1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(img0, "click", refreshPage, false, false, false),
    					listen_dev(input, "change", /*change_handler*/ ctx[2], false, false, false),
    					listen_dev(button1, "click", /*doSomeMagic*/ ctx[1], false, false, false),
    					listen_dev(button2, "click", download, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			detach_dev(link);
    			detach_dev(script);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(nav);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t10);
    			if (detaching) detach_dev(div3);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(div4);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function refreshPage() {
    	window.location.reload();
    }

    function manipulateImage(i) {
    	let mat = cv.imread(i);
    	cv.cvtColor(mat, mat, cv.COLOR_BGR2GRAY);
    	let gaussianBlurred = new cv.Mat();
    	let ksize = new cv.Size(5, 5);
    	document.getElementById("downloadButton").style.display = "block";
    	cv.GaussianBlur(mat, gaussianBlurred, ksize, 0, 0, cv.BORDER_DEFAULT);
    	cv.imshow("outputImage", gaussianBlurred);
    	let secondGrayPass = new cv.Mat();
    	cv.cvtColor(gaussianBlurred, secondGrayPass, cv.COLOR_BGR2GRAY);
    	cv.imshow("outputImage", secondGrayPass);
    	mat.delete();
    }

    function download() {
    	var link = document.createElement("a");
    	link.download = "noBackground.png";
    	link.href = document.getElementById("outputImage").toDataURL();
    	link.click();
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let chosenImage = null;

    	function updateImage(e) {
    		chosenImage = e.target.files[0];
    	}

    	function doSomeMagic() {
    		console.log("MAGIC");
    		let image = new Image();
    		image.src = URL.createObjectURL(chosenImage);

    		image.onload = function () {
    			console.log(image);

    			if (image) {
    				manipulateImage(image);
    			}
    		};
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const change_handler = e => updateImage(e);

    	$$self.$capture_state = () => ({
    		chosenImage,
    		refreshPage,
    		updateImage,
    		doSomeMagic,
    		manipulateImage,
    		download
    	});

    	$$self.$inject_state = $$props => {
    		if ('chosenImage' in $$props) chosenImage = $$props.chosenImage;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [updateImage, doSomeMagic, change_handler];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    var app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
