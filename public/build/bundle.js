
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
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
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
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
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
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
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
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
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

    const durationUnitRegex = /[a-zA-Z]/;
    const range = (size, startAt = 0) => [...Array(size).keys()].map(i => i + startAt);
    // export const characterRange = (startChar, endChar) =>
    //   String.fromCharCode(
    //     ...range(
    //       endChar.charCodeAt(0) - startChar.charCodeAt(0),
    //       startChar.charCodeAt(0)
    //     )
    //   );
    // export const zip = (arr, ...arrs) =>
    //   arr.map((val, i) => arrs.reduce((list, curr) => [...list, curr[i]], [val]));

    /* node_modules/svelte-loading-spinners/dist/Jumper.svelte generated by Svelte v3.42.1 */
    const file$1 = "node_modules/svelte-loading-spinners/dist/Jumper.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (44:2) {#each range(3, 1) as version}
    function create_each_block(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "circle svelte-1cy66mt");
    			set_style(div, "animation-delay", /*durationNum*/ ctx[5] / 3 * (/*version*/ ctx[6] - 1) + /*durationUnit*/ ctx[4]);
    			add_location(div, file$1, 44, 4, 991);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(44:2) {#each range(3, 1) as version}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let each_value = range(3, 1);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "wrapper svelte-1cy66mt");
    			set_style(div, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			set_style(div, "--color", /*color*/ ctx[0]);
    			set_style(div, "--duration", /*duration*/ ctx[2]);
    			add_location(div, file$1, 40, 0, 852);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*durationNum, range, durationUnit*/ 48) {
    				each_value = range(3, 1);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*size, unit*/ 10) {
    				set_style(div, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			}

    			if (dirty & /*color*/ 1) {
    				set_style(div, "--color", /*color*/ ctx[0]);
    			}

    			if (dirty & /*duration*/ 4) {
    				set_style(div, "--duration", /*duration*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Jumper', slots, []);
    	
    	let { color = "#FF3E00" } = $$props;
    	let { unit = "px" } = $$props;
    	let { duration = "1s" } = $$props;
    	let { size = "60" } = $$props;
    	let durationUnit = duration.match(durationUnitRegex)[0];
    	let durationNum = duration.replace(durationUnitRegex, "");
    	const writable_props = ['color', 'unit', 'duration', 'size'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Jumper> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    	};

    	$$self.$capture_state = () => ({
    		range,
    		durationUnitRegex,
    		color,
    		unit,
    		duration,
    		size,
    		durationUnit,
    		durationNum
    	});

    	$$self.$inject_state = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('durationUnit' in $$props) $$invalidate(4, durationUnit = $$props.durationUnit);
    		if ('durationNum' in $$props) $$invalidate(5, durationNum = $$props.durationNum);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [color, unit, duration, size, durationUnit, durationNum];
    }

    class Jumper extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { color: 0, unit: 1, duration: 2, size: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Jumper",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get color() {
    		throw new Error("<Jumper>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Jumper>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get unit() {
    		throw new Error("<Jumper>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set unit(value) {
    		throw new Error("<Jumper>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get duration() {
    		throw new Error("<Jumper>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<Jumper>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Jumper>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Jumper>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.42.1 */

    const { console: console_1, document: document_1 } = globals;
    const file = "src/App.svelte";

    // (118:2) {#if fileTooBig}
    function create_if_block_1(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "That file is too big (╯°□°）╯︵ ┻━┻";
    			attr_dev(h1, "class", "text-right my-5");
    			set_style(h1, "color", "rebeccaPurple");
    			add_location(h1, file, 118, 4, 3137);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(118:2) {#if fileTooBig}",
    		ctx
    	});

    	return block;
    }

    // (158:0) {#if showSpinner}
    function create_if_block(ctx) {
    	let div3;
    	let div0;
    	let t0;
    	let div1;
    	let jumper;
    	let t1;
    	let div2;
    	let current;

    	jumper = new Jumper({
    			props: {
    				size: "90",
    				color: "#7a0bea",
    				unit: "px",
    				duration: "2s"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			create_component(jumper.$$.fragment);
    			t1 = space();
    			div2 = element("div");
    			attr_dev(div0, "class", "col-5");
    			add_location(div0, file, 159, 4, 4109);
    			attr_dev(div1, "class", "col-4 mx-auto text-center");
    			add_location(div1, file, 160, 4, 4135);
    			attr_dev(div2, "class", "col-3");
    			add_location(div2, file, 163, 4, 4257);
    			attr_dev(div3, "class", "row");
    			add_location(div3, file, 158, 2, 4087);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div3, t0);
    			append_dev(div3, div1);
    			mount_component(jumper, div1, null);
    			append_dev(div3, t1);
    			append_dev(div3, div2);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(jumper.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(jumper.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_component(jumper);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(158:0) {#if showSpinner}",
    		ctx
    	});

    	return block;
    }

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
    	let li0;
    	let a0;
    	let t4;
    	let li1;
    	let a1;
    	let t6;
    	let li2;
    	let a2;
    	let t8;
    	let div1;
    	let h3;
    	let t9;
    	let p0;
    	let t10;
    	let p1;
    	let t11;
    	let t12;
    	let t13;
    	let div3;
    	let input0;
    	let t14;
    	let p2;
    	let t15;
    	let div2;
    	let input1;
    	let t16;
    	let p3;
    	let t17;
    	let h4;
    	let t18;
    	let t19;
    	let p4;
    	let t20;
    	let button1;
    	let span1;
    	let t22;
    	let t23;
    	let div4;
    	let button2;
    	let span2;
    	let t25;
    	let div5;
    	let canvas;
    	let t26;
    	let img1;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*fileTooBig*/ ctx[2] && create_if_block_1(ctx);
    	let if_block1 = /*showSpinner*/ ctx[0] && create_if_block(ctx);

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
    			li0 = element("li");
    			a0 = element("a");
    			a0.textContent = "How it works";
    			t4 = space();
    			li1 = element("li");
    			a1 = element("a");
    			a1.textContent = "About";
    			t6 = space();
    			li2 = element("li");
    			a2 = element("a");
    			a2.textContent = "Donate";
    			t8 = space();
    			div1 = element("div");
    			h3 = element("h3");
    			t9 = text("1. Simply choose a PNG or JPG file. (maximum 2MB) ");
    			p0 = element("p");
    			t10 = text("\n    2. Select blurriness strength (100 is extra blurry)\n    ");
    			p1 = element("p");
    			t11 = text("\n    3. Click Blur! and hopefully watch some magic");
    			t12 = space();
    			if (if_block0) if_block0.c();
    			t13 = space();
    			div3 = element("div");
    			input0 = element("input");
    			t14 = space();
    			p2 = element("p");
    			t15 = space();
    			div2 = element("div");
    			input1 = element("input");
    			t16 = space();
    			p3 = element("p");
    			t17 = text("\n    Strength:\n    ");
    			h4 = element("h4");
    			t18 = text(/*blurStrength*/ ctx[1]);
    			t19 = space();
    			p4 = element("p");
    			t20 = space();
    			button1 = element("button");
    			span1 = element("span");
    			span1.textContent = "Blur!";
    			t22 = space();
    			if (if_block1) if_block1.c();
    			t23 = space();
    			div4 = element("div");
    			button2 = element("button");
    			span2 = element("span");
    			span2.textContent = "Download!";
    			t25 = space();
    			div5 = element("div");
    			canvas = element("canvas");
    			t26 = space();
    			img1 = element("img");
    			attr_dev(link, "href", "https://fonts.googleapis.com/css2?family=Space+Grotesk&display=swap");
    			attr_dev(link, "rel", "stylesheet");
    			add_location(link, file, 67, 2, 1681);
    			script.async = true;
    			if (!src_url_equal(script.src, script_src_value = "js/opencv.js")) attr_dev(script, "src", script_src_value);
    			add_location(script, file, 71, 2, 1794);
    			set_style(img0, "cursor", "pointer");
    			if (!src_url_equal(img0.src, img0_src_value = "images/Logo.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "width", "150");
    			attr_dev(img0, "alt", "");
    			add_location(img0, file, 75, 2, 1930);
    			attr_dev(span0, "class", "navbar-toggler-icon");
    			add_location(span0, file, 91, 4, 2283);
    			attr_dev(button0, "class", "navbar-toggler");
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "data-toggle", "collapse");
    			attr_dev(button0, "data-target", "#navbarSupportedContent");
    			attr_dev(button0, "aria-controls", "navbarSupportedContent");
    			attr_dev(button0, "aria-expanded", "false");
    			attr_dev(button0, "aria-label", "Toggle navigation");
    			add_location(button0, file, 82, 2, 2049);
    			attr_dev(a0, "class", "textPurple font svelte-136bf0v");
    			attr_dev(a0, "href", "https://www.patreon.com/alivillegas");
    			add_location(a0, file, 97, 8, 2496);
    			attr_dev(li0, "class", "nav-item mx-auto p-2");
    			add_location(li0, file, 96, 6, 2454);
    			attr_dev(a1, "class", "textPurple font svelte-136bf0v");
    			attr_dev(a1, "href", "");
    			add_location(a1, file, 102, 8, 2663);
    			attr_dev(li1, "class", "nav-item mx-auto p-2");
    			add_location(li1, file, 101, 6, 2621);
    			attr_dev(a2, "class", "textPurple font svelte-136bf0v");
    			attr_dev(a2, "href", "");
    			add_location(a2, file, 105, 8, 2768);
    			attr_dev(li2, "class", "nav-item mx-auto p-2");
    			add_location(li2, file, 104, 6, 2726);
    			attr_dev(ul, "class", "navbar-nav mx-auto my-2 p-3 ");
    			add_location(ul, file, 95, 4, 2406);
    			attr_dev(div0, "class", "collapse navbar-collapse");
    			attr_dev(div0, "id", "navbarSupportedContent");
    			add_location(div0, file, 94, 2, 2335);
    			attr_dev(nav, "class", "navbar navbar-expand-lg navbar-light borderBottomPurple mb-3 svelte-136bf0v");
    			add_location(nav, file, 74, 0, 1853);
    			add_location(p0, file, 112, 54, 2984);
    			add_location(p1, file, 114, 4, 3050);
    			attr_dev(h3, "class", "text-right");
    			add_location(h3, file, 111, 2, 2906);
    			attr_dev(div1, "class", "mx-auto d-block text-center my-5 font svelte-136bf0v");
    			add_location(div1, file, 110, 0, 2852);
    			attr_dev(input0, "id", "fileInput");
    			attr_dev(input0, "class", "text-center mx-auto");
    			attr_dev(input0, "type", "file");
    			set_style(input0, "width", "50vw");
    			set_style(input0, "height", "5vw");
    			set_style(input0, "min-height", "50px");
    			attr_dev(input0, "name", "upfile");
    			attr_dev(input0, "accept", "image/png,image/jpeg");
    			input0.required = true;
    			add_location(input0, file, 124, 2, 3308);
    			add_location(p2, file, 134, 2, 3545);
    			set_style(input1, "width", "50vw");
    			set_style(input1, "background-color", "rebeccapurple");
    			attr_dev(input1, "type", "range");
    			attr_dev(input1, "min", "1");
    			attr_dev(input1, "max", "100");
    			attr_dev(input1, "class", "slider");
    			attr_dev(input1, "id", "myRange");
    			add_location(input1, file, 136, 4, 3591);
    			add_location(p3, file, 146, 4, 3830);
    			attr_dev(h4, "class", "text-right");
    			add_location(h4, file, 148, 4, 3854);
    			attr_dev(div2, "class", "slidecontainer font svelte-136bf0v");
    			add_location(div2, file, 135, 2, 3553);
    			add_location(p4, file, 152, 2, 3920);
    			set_style(span1, "margin-bottom", "10");
    			add_location(span1, file, 154, 4, 4000);
    			attr_dev(button1, "class", "begoneBtn borderPurple my-3 svelte-136bf0v");
    			add_location(button1, file, 153, 2, 3928);
    			attr_dev(div3, "class", "mx-auto d-block text-center my-3");
    			add_location(div3, file, 123, 0, 3259);
    			set_style(span2, "margin-bottom", "10");
    			add_location(span2, file, 174, 4, 4482);
    			attr_dev(button2, "class", "begoneBtn borderPurple my-5 mx-auto  svelte-136bf0v");
    			set_style(button2, "display", "none");
    			attr_dev(button2, "id", "downloadButton");
    			add_location(button2, file, 168, 2, 4344);
    			attr_dev(div4, "class", "mx-auto d-block text-center my-5");
    			add_location(div4, file, 167, 0, 4295);
    			attr_dev(canvas, "id", "outputImage");
    			attr_dev(canvas, "width", "500");
    			add_location(canvas, file, 178, 2, 4602);
    			attr_dev(img1, "id", "input_img");
    			attr_dev(img1, "alt", "");
    			set_style(img1, "display", "none");
    			add_location(img1, file, 179, 2, 4644);
    			attr_dev(div5, "class", "mx-auto d-block text-center my-3");
    			add_location(div5, file, 177, 0, 4553);
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
    			append_dev(ul, li0);
    			append_dev(li0, a0);
    			append_dev(ul, t4);
    			append_dev(ul, li1);
    			append_dev(li1, a1);
    			append_dev(ul, t6);
    			append_dev(ul, li2);
    			append_dev(li2, a2);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h3);
    			append_dev(h3, t9);
    			append_dev(h3, p0);
    			append_dev(h3, t10);
    			append_dev(h3, p1);
    			append_dev(h3, t11);
    			append_dev(div1, t12);
    			if (if_block0) if_block0.m(div1, null);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, input0);
    			append_dev(div3, t14);
    			append_dev(div3, p2);
    			append_dev(div3, t15);
    			append_dev(div3, div2);
    			append_dev(div2, input1);
    			set_input_value(input1, /*blurStrength*/ ctx[1]);
    			append_dev(div2, t16);
    			append_dev(div2, p3);
    			append_dev(div2, t17);
    			append_dev(div2, h4);
    			append_dev(h4, t18);
    			append_dev(div3, t19);
    			append_dev(div3, p4);
    			append_dev(div3, t20);
    			append_dev(div3, button1);
    			append_dev(button1, span1);
    			insert_dev(target, t22, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, t23, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, button2);
    			append_dev(button2, span2);
    			insert_dev(target, t25, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, canvas);
    			append_dev(div5, t26);
    			append_dev(div5, img1);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(img0, "click", refreshPage, false, false, false),
    					listen_dev(input0, "change", /*change_handler*/ ctx[5], false, false, false),
    					listen_dev(input1, "change", /*input1_change_input_handler*/ ctx[6]),
    					listen_dev(input1, "input", /*input1_change_input_handler*/ ctx[6]),
    					listen_dev(
    						input1,
    						"change",
    						function () {
    							if (is_function(console.log(/*blurStrength*/ ctx[1]))) console.log(/*blurStrength*/ ctx[1]).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(button1, "click", /*doSomeMagic*/ ctx[4], false, false, false),
    					listen_dev(button2, "click", download, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (/*fileTooBig*/ ctx[2]) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					if_block0.m(div1, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty & /*blurStrength*/ 2) {
    				set_input_value(input1, /*blurStrength*/ ctx[1]);
    			}

    			if (!current || dirty & /*blurStrength*/ 2) set_data_dev(t18, /*blurStrength*/ ctx[1]);

    			if (/*showSpinner*/ ctx[0]) {
    				if (if_block1) {
    					if (dirty & /*showSpinner*/ 1) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(t23.parentNode, t23);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			detach_dev(link);
    			detach_dev(script);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(nav);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(div1);
    			if (if_block0) if_block0.d();
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(div3);
    			if (detaching) detach_dev(t22);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(t23);
    			if (detaching) detach_dev(div4);
    			if (detaching) detach_dev(t25);
    			if (detaching) detach_dev(div5);
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
    	let showSpinner = false;
    	let blurStrength = 50;
    	let fileTooBig = false;

    	function updateImage(e) {
    		chosenImage = e.target.files[0];
    	}

    	function doSomeMagic() {
    		$$invalidate(2, fileTooBig = false);
    		$$invalidate(0, showSpinner = true);
    		console.log("MAGIC");
    		let image = new Image();

    		if (chosenImage === null) {
    			$$invalidate(0, showSpinner = false);
    			return;
    		} else {
    			if (chosenImage.size > 2097152) {
    				$$invalidate(2, fileTooBig = true);
    				this.value = "";
    				$$invalidate(0, showSpinner = false);
    				return;
    			}
    		}

    		image.src = URL.createObjectURL(chosenImage);

    		image.onload = function () {
    			if (image) {
    				manipulateImage(image);
    			}
    		};
    	}

    	function manipulateImage(i) {
    		let mat = cv.imread(i);
    		document.getElementById("downloadButton").style.display = "block";
    		let gaussianBlurred = new cv.Mat();
    		let strength = parseFloat(blurStrength * 2);

    		if (!(strength % 2)) {
    			strength = strength + 1;
    		}

    		console.log("sizes", strength);
    		let ksize = new cv.Size(strength, strength);
    		cv.GaussianBlur(mat, gaussianBlurred, ksize, cv.BORDER_DEFAULT);
    		cv.imshow("outputImage", gaussianBlurred);
    		window.scrollTo(0, document.body.scrollHeight);
    		$$invalidate(0, showSpinner = false);

    		//delete matrices
    		mat.delete();

    		gaussianBlurred.delete();
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const change_handler = e => updateImage(e);

    	function input1_change_input_handler() {
    		blurStrength = to_number(this.value);
    		$$invalidate(1, blurStrength);
    	}

    	$$self.$capture_state = () => ({
    		Jumper,
    		chosenImage,
    		showSpinner,
    		blurStrength,
    		fileTooBig,
    		refreshPage,
    		updateImage,
    		doSomeMagic,
    		manipulateImage,
    		download
    	});

    	$$self.$inject_state = $$props => {
    		if ('chosenImage' in $$props) chosenImage = $$props.chosenImage;
    		if ('showSpinner' in $$props) $$invalidate(0, showSpinner = $$props.showSpinner);
    		if ('blurStrength' in $$props) $$invalidate(1, blurStrength = $$props.blurStrength);
    		if ('fileTooBig' in $$props) $$invalidate(2, fileTooBig = $$props.fileTooBig);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		showSpinner,
    		blurStrength,
    		fileTooBig,
    		updateImage,
    		doSomeMagic,
    		change_handler,
    		input1_change_input_handler
    	];
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
