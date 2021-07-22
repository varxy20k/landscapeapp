import React, { useState } from 'react'
import { existsSync, readFileSync } from 'fs'
import traverse from 'traverse'
import Typography from '@material-ui/core/Typography'
import classNames from 'classnames'
import MenuIcon from '@material-ui/icons/Menu'
import IconButton from '@material-ui/core/IconButton'
import RoomIcon from '@material-ui/icons/Room'
import CloseIcon from '@material-ui/icons/Close'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Header from '../components/Header'
import assetPath from '../utils/assetPath'
import { LandscapeProvider } from '../contexts/LandscapeContext'
import { parseParams } from '../utils/routing'
import getPrerenderProps from '../utils/getPrerenderProps'
import Item from '../components/BigPicture/Item'
import { findLandscapeSettings } from '../utils/landscapeSettings'
import { isLargeFn } from '../utils/landscapeCalculations'

const GuidePage = ({ content, title, entries, mainContentMode }) => {
  const nodes = traverse(content).reduce(function(acc, node) {
    if (node.title || node.content) {
      acc.push({ ...node, key: this.path.join('-') })
    }
    return acc
  }, [])

  const landscapeSettings = findLandscapeSettings(mainContentMode)
  const categories = landscapeSettings.elements.map(element => element).reduce((acc, category) => {
    return { ...acc, [category.category]: category }
  }, {})

  const enhancedEntries = entries.map(entry => {
    const categoryAttrs = categories[entry.category]
    const enhanced = { ...entry, categoryAttrs, isVisible: true }
    return { ...enhanced, isLarge: isLargeFn(enhanced) }
  })

  const [sidebarVisible, setSidebarVisible] = useState(false)
  const showSidebar = _ => setSidebarVisible(true)
  const hideSidebar = _ => setSidebarVisible(false)

  const { asPath } = useRouter()
  const currentSection = asPath.split('#')[1]

  return <LandscapeProvider entries={entries} pageParams={{ mainContentMode }}>
    <Head>
      <title>Guide - {title}</title>
    </Head>

    <div id="guide-page" className={classNames('app',{'filters-opened' : sidebarVisible, 'big-picture': true })}>
      <div className="main-parent" >
        <Header />
        <IconButton className="sidebar-show" title="Show sidebar" onClick={showSidebar}><MenuIcon /></IconButton>
        <div className="sidebar">
          <div className="sidebar-scroll">
            <IconButton className="sidebar-collapse" title="Hide sidebar" onClick={hideSidebar}><CloseIcon /></IconButton>
            {
              nodes.filter(node => node.title)
                .map(node => <div key={node.key} style={{ marginLeft: node.level * 8, marginBottom: 6 }}>
                  <Link href={`#${node.identifier}`} prefetch={false}>
                    <a className={`nav-link`} style={{ color: node.identifier === currentSection ? 'black' : null }}>{node.title}</a>
                  </Link>
                </div>
              )
            }
          </div>
        </div>
        <div className="main">
          {
            nodes.map(node => {
              return <div key={node.key} id={node.title && node.identifier} >
                { node.title && <Typography variant={`h${node.level + 1}`}>
                  { node.permalink && <a href={assetPath(`/card-mode?category=${node.permalink}`)} target="_blank" className="permalink">
                    {node.title}<RoomIcon />
                  </a> }
                  { !node.permalink && node.title }
                </Typography> }
                { node.isText && <div className="guide-content" dangerouslySetInnerHTML={{ __html: node.content }} /> }
                { node.subcategory && <div className="items">
                  {
                    enhancedEntries.filter(entry => entry.path.split('/')[1].trim() === node.title)
                      .map(entry => <Item item={entry}/>)
                  }
                </div>}
              </div>
            })
          }
        </div>
      </div>
    </div>
  </LandscapeProvider>
}

export async function getStaticProps() {
  const notFound = !existsSync('public/guide.json')
  const { content } = notFound ? {} : JSON.parse(readFileSync('public/guide.json', 'utf-8'))
  const settings = JSON.parse(require('fs').readFileSync('public/settings.json', 'utf-8'))
  const mainContentMode = 'landscape'
  const params = parseParams({ mainContentMode })
  const { entries } = getPrerenderProps(params)
  const props = { content, mainContentMode, entries, title: settings.global.meta.title }
  return { props, notFound }
}

export default GuidePage
