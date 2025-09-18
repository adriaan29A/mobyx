import { useEffect, useState } from "react"
import { NewTodoForm } from "./NewTodoForm"
import { TodoList } from "./TodoList" // remove ?
import { Synset } from "./Synset.jsx"
import { CreateNavigator } from "./nav.js"
import { random_node } from "./core.js"
import InstallPWA from "./InstallPWA.jsx"


//------------------------------------------------------------------------------
// Hooks
//
// Window Dims

// Windows dimensions

function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height
  };
}

function useWindowDimensions() {

	const [windowDimensions, setWindowDimensions] = useState(
    getWindowDimensions()
  );

  useEffect(() => {
    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [] );

  return windowDimensions;
}

// performance timer hook

/*
import React, { useState, useEffect } from 'react';

function MyComponent() {
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    const startTime = performance.now();

    const intervalId = setInterval(() => {
      const endTime = performance.now();
      setTimeElapsed(endTime - startTime);
    }, 1000); // Update every 1 second

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  return (
    <div>
      Time elapsed: {timeElapsed / 1000} seconds
    </div>
  );
}
*/


/*


*/




//------------------------------------------------------------------------------
// App


export default function App() {

	var nav = CreateNavigator();

	const [navctx, setNavctx] = useState(() => {
		const localValue = localStorage.getItem("NAVCTX26")
		if (localValue == null) {
			console.log('localValue null')

			nav.current = nav.origin = random_node();
			nav.history = [nav.current];

			return nav.get();
		}
		return JSON.parse(localValue)
	})

	useEffect(() => {
		localStorage.setItem("NAVCTX26", JSON.stringify(navctx))
	}, [navctx])

	function setCtx(ctx) {
		setNavctx((navctx) => {return ctx });

	}

	// nav object is set and ready to go.
	nav.set(navctx);

	// Get the main window dimensions
	const extent = useWindowDimensions();

	return (
		<>
		<Synset nav = {nav} extent = {extent} onClick = { setCtx } />
		<NewTodoForm nav = { nav } onSubmit = { setCtx } />
		<InstallPWA />
		</>
	)
}
