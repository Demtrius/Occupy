import { useState, useCallback } from 'react'
import {
  cliquesService,
  postsService,
  bookingService,
  availabilityService,
  servicesService,
} from '../services'
import { showError } from '../store/app.store'
import type { Post, Service, Availability, Booking } from '../types'

type TabType = 'About' | 'Services' | 'Availability' | 'Bookings' | 'Posts' | 'Reviews'

export const useTabData = (cliqueId: number, isOwner: boolean) => {
  const [posts, setPosts] = useState<Post[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [availability, setAvailability] = useState<Availability[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])

  const loadTabData = useCallback(
    async (tab: TabType) => {
      try {
        switch (tab) {
          case 'Services':
            const servicesData = await servicesService.getCliqueServices(cliqueId)
            setServices(servicesData)
            break
          case 'Availability':
            const availabilityData = await availabilityService.getCliqueAvailability(cliqueId)
            setAvailability(availabilityData)
            break
          case 'Bookings':
            if (isOwner) {
              const bookingsData = await bookingService.getCliqueBookings(cliqueId)
              setBookings(bookingsData)
            }
            break
          case 'Posts':
            const postsData = await postsService.getPostsByClique(cliqueId)
            setPosts(Array.isArray(postsData) ? postsData : postsData.results || [])
            break
        }
      } catch (error: any) {
        console.error(`Error loading ${tab} data:`, error)
        showError(`Failed to load ${tab.toLowerCase()}`)
      }
    },
    [cliqueId, isOwner]
  )

  return {
    posts,
    services,
    availability,
    bookings,
    loadTabData,
  }
}